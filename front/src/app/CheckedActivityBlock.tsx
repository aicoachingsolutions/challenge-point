/**
 * THE ACTIVITY, AS A COACH WOULD PRINT IT — moved here unchanged from the activity review page on 22 October 2026 (the live-app fix,
 * design section 4.3 L2), so the live app's guided flow and the saved activity render a checked activity through the SAME component the
 * review page uses: the Coach Overview (learning purpose, the game, the parameters, the field diagram, how each team scores) and the Coach
 * details. Christian's 25 October item 8 asks that the gap between the checked review pathway and the live application be closed; the
 * live app shows exactly what the review page shows. Everything below is the review page's own code and comments, moved and not edited.
 *
 * What a coach is served carries no review evidence and no drafts, so the administrator-only tags, legends and notes below never render
 * for one; they render only where an administrator's review answer carries them, as before.
 *
 * NO LEARNING GOAL, DEMONSTRATION OR ROLE IS NAMED IN THIS FILE. If one appears below as a string literal, knowledge has leaked into it.
 */
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useEffect, useId, useState } from 'react'

import {
    CoachOverview,
    OverviewLine,
    OverviewPointer,
    ReviewDiagramDraft,
    ReviewInstruction,
    ReviewOverviewDraft,
    ReviewWordingStatus,
    ServedActivity,
} from '@/MODELS/activity-review.model'

import FieldDiagram from './FieldDiagram'

/**
 * The section a coach reads AFTER the starting setup (14 October 2026, Christian §7: "My preference is that the
 * main activity present a clear starting setup and playing instructions. Alternative ranges, adjustments, and
 * supporting explanations can be presented separately when useful."). The name is the server's; it is a DRAFT.
 */
const ADJUSTING_SECTION = 'Adjusting the activity'

/**
 * The section saying how the roles pass between the teams (15 October 2026, his M1 and D2: "Please make that distinction
 * explicit in the coach-facing instructions."). Present only for an activity played in role blocks; the name is the
 * server's and a DRAFT.
 */
const ROLE_EXCHANGE_SECTION = 'Role exchange'

/**
 * The order a coach reads an activity in. Organisation only — the section name comes from the server, which assigns it
 * (back/src/system/rendering/sections.ts, SECTION_ORDER, stage 2A of 21 October 2026: "When it ends" and "Restarts and
 * ball out" added, both DRAFT names). Kept equal to the server's order; a section this list lacks is still shown, after it.
 */
const SECTION_ORDER = ['Set up', 'Players', 'How it works', 'How to score', 'When it ends', ROLE_EXCHANGE_SECTION, 'Restarts and ball out', ADJUSTING_SECTION]

/**
 * "Block 1 only" for a sentence that holds in one role block (15 October 2026): the block's number in the order the
 * server lists the blocks, never its technical id. A DRAFT label; which block is played first is the coach's.
 *
 * Stage 2C (21 October 2026): a sentence the blocks say in the same words, each citing its own role's target, is said once
 * (`counterparts`) and holds in every block, so it carries no block label, even if a block were also named on it.
 */
function blockLabel(activity: ServedActivity, instruction: ReviewInstruction): string | null {
    if (!instruction.block || instruction.counterparts) return null
    const at = (activity.roleBlocks?.blocks ?? []).findIndex((block) => block.blockId === instruction.block)
    return `Block ${at >= 0 ? at + 1 : '?'} only: `
}

/**
 * "Block 2" for a block named in the account (stage 2C, 21 October 2026): its number in the order the server lists the blocks, never its
 * technical id, as `blockLabel`. A DRAFT account label.
 */
export function blockNumberLabel(activity: ServedActivity, blockId: string | undefined): string {
    const at = (activity.roleBlocks?.blocks ?? []).findIndex((block) => block.blockId === blockId)
    return `Block ${at >= 0 ? at + 1 : '?'}`
}

/**
 * The one line that introduces the adjusting part. Coach wording, a DRAFT for his approval under the CCS. (The
 * design's draft read "Change it within these limits:"; the part also holds preferred guidance, which is not a limit,
 * so the line names both.)
 */
const ADJUSTING_LEAD = 'The setup above is where the activity starts. To adjust it, use these limits and guidance:'

/**
 * The headings of the two levels (stage 4, 22 October 2026). Christian, reply filed 22 October 2026, item 1: "Coach Overview — The
 * immediate understanding of the activity: learning purpose, one-sentence game description, basic parameters, essential scoring
 * objectives, and a simple diagram. Coach Details — The complete instructions organized by function". "Learning purpose" and "The game"
 * follow his illustration in item 5 ("Learning Purpose: ...", "The Game: ..."); "How each team scores" is ours. All are DRAFT coach
 * wording, the same for every activity: no Learning Goal, role or value is named here.
 */
const OVERVIEW_HEADINGS = { purpose: 'Learning purpose', game: 'The game', scoring: 'How each team scores', details: 'Coach details' }

/**
 * The lead-in to a team's (or every team's) "full rule" pointers that no line carries, each then shown as a link named by the Coach details
 * section it opens (polish pass P3, 22 October 2026; was: "full rule (How it works) · full rule (How to score)"). DRAFT coach wording.
 */
const MORE_IN_DETAILS = `More in ${OVERVIEW_HEADINGS.details}:`

/**
 * The three wording statuses, in Christian's names (reply filed 22 October 2026, item 4: "Please distinguish between: Approved canonical
 * wording. An abbreviated presentation derived from approved wording. Newly proposed language awaiting approval."). `meaning` is his
 * words, for the legend; `tag` is a short form of each (DRAFT, stage 4). For an administrator only: a status serves review and provenance,
 * never coaching, so a coach's page shows none. A status this map does not know is tagged as the server sent it, never hidden.
 */
const WORDING_STATUS: Record<string, { tag: string; meaning: string; className: string }> = {
    APPROVED: { tag: 'Approved', meaning: 'Approved canonical wording', className: 'text-emerald-800 bg-emerald-50' },
    DERIVED_FROM_APPROVED: { tag: 'Abbreviated from approved', meaning: 'An abbreviated presentation derived from approved wording', className: 'text-sky-800 bg-sky-50' },
    DRAFT: { tag: 'Proposed', meaning: 'Newly proposed language awaiting approval', className: 'text-gray-700 bg-gray-100' },
}
const isKnownWording = (wording: unknown): wording is string => typeof wording === 'string' && Object.prototype.hasOwnProperty.call(WORDING_STATUS, wording)

/**
 * The instructions under their sections: the known sections in reading order, then any section the
 * server sent that this page has not heard of, in the order it first appears.
 *
 * The second half is the point. A fixed list of five would silently drop every instruction filed under a
 * sixth, and the coach would be handed an activity with a rule missing and nothing to say so.
 */
export function groupBySection(instructions: ReviewInstruction[]): { section: string; lines: ReviewInstruction[] }[] {
    const sections = [...SECTION_ORDER]
    for (const instruction of instructions) {
        if (!sections.includes(instruction.section)) sections.push(instruction.section)
    }
    return sections
        .map((section) => ({ section, lines: instructions.filter((instruction) => instruction.section === section) }))
        .filter((group) => group.lines.length > 0)
}

/**
 * Christian, 13 October: "Intermediate mechanism demonstrations are useful, but they should remain clearly
 * identified as such." So the label travels with the result — onto the activity and onto a refusal —
 * rather than staying behind in the picker where it was chosen.
 */
export function DemonstrationLabel() {
    return (
        <span className='inline-block px-2 py-1 mb-3 text-xs font-semibold text-indigo-800 bg-indigo-100 rounded-full'>
            Mechanism demonstration
        </span>
    )
}

type Wording = ReviewWordingStatus

/**
 * Whose wording each served sentence is, for an administrator: one of his three statuses, as the review evidence says.
 *
 * Christian's reply filed 20 October 2026: "this approval applies specifically to the two scoring statements, not yet to
 * the entire activity" — and we told him every other sentence is marked as a draft. The mark exists only in the evidence,
 * so it is joined back to the rendered sentence here. The join is by index (the evidence's `index` is the sentence's place
 * in `rendered.instructions`) AND by section, block and text: a sentence whose evidence does not match on all four gets no
 * tag at all, because a wrong "Approved" is worse than none. Null for a coach, who receives no evidence.
 *
 * Stage 4: the status must be one of his three (`WORDING_STATUS`); the Coach Details hold no abbreviation today (approved
 * wording stays word for word there), so in practice a Details sentence is Approved or Proposed.
 */
function wordingBySentence(activity: ServedActivity): { tags: Map<ReviewInstruction, Wording>; unmatched: number } | null {
    const sentences = activity.evidence?.sections?.instructions
    if (!Array.isArray(sentences)) return null
    const tags = new Map<ReviewInstruction, Wording>()
    let unmatched = 0
    activity.rendered.instructions.forEach((instruction, at) => {
        const candidates = sentences.filter((sentence) => sentence.index === at)
        const sentence = candidates.length === 1 ? candidates[0] : null
        const matches =
            !!sentence &&
            sentence.text === instruction.text &&
            sentence.section === instruction.section &&
            (sentence.block ?? null) === (instruction.block ?? null) &&
            isKnownWording(sentence.wording)
        if (matches) tags.set(instruction, sentence.wording)
        else unmatched += 1
    })
    return { tags, unmatched }
}

/**
 * Whose wording each section label is, for an administrator: the review of stage 2A, 21 October 2026. A section label is
 * coach-facing wording like a sentence, and the server records its status beside the sentences' (`evidence.sections.labels`;
 * none is approved yet). Joined by the section's name AND by the sentences under it: a label whose evidence does not list
 * exactly the sentences the page shows under it gets no tag, as in `wordingBySentence`. Null for a coach, who receives no evidence.
 */
function wordingByLabel(activity: ServedActivity): Map<string, Wording> | null {
    const labels = activity.evidence?.sections?.labels
    if (!Array.isArray(labels)) return null
    const tags = new Map<string, Wording>()
    for (const label of labels) {
        const shown = activity.rendered.instructions.flatMap((instruction, at) => (instruction.section === label.section ? [at] : []))
        const matches =
            Array.isArray(label.sentences) &&
            label.sentences.length === shown.length &&
            label.sentences.every((index, n) => index === shown[n]) &&
            isKnownWording(label.status)
        if (matches) tags.set(label.section, label.status)
    }
    return tags
}

/** The tag beside a section heading in the administrator's view; the heading's capitals are not applied to it. */
function LabelTag({ wording }: { wording: Wording | undefined }) {
    if (!wording) return null
    return (
        <span className='tracking-normal normal-case'>
            <WordingTag wording={wording} />
        </span>
    )
}

/**
 * The quiet tag beside a sentence in the administrator's view: the short form of his status name (stage 4; the short forms are DRAFT).
 * `note` is a tooltip saying where the sentence is from, for an administrator.
 */
function WordingTag({ wording, note, flush = false }: { wording: Wording | undefined; note?: string | null; flush?: boolean }) {
    if (!wording) return null
    const known = isKnownWording(wording) ? WORDING_STATUS[wording] : null
    return (
        <span title={note ?? undefined} className={`${flush ? '' : 'ml-2 '}inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${known?.className ?? 'text-amber-900 bg-amber-50'}`}>
            {known?.tag ?? wording}
        </span>
    )
}

/**
 * The reading label beside his wording that stands for what it states by a recorded reading (stage 3E), for an administrator only: the
 * server's DRAFT words, "reading approved" where he approved every reading it stands by (C1, his reply filed 24 October 2026, item 1),
 * else "reading PROPOSED, awaiting confirmation". Approved in the approved tag's green, PROPOSED in amber; a status the page does not know
 * is shown as amber, never as approved.
 */
function ReadingTag({ label, status }: { label: string | null | undefined; status?: string | null }) {
    if (!label) return null
    const className = status === 'APPROVED' ? 'text-emerald-800 bg-emerald-50' : 'text-amber-900 bg-amber-50'
    return <span className={`ml-1 inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${className}`}>{label}</span>
}

/** One overview sentence's tag, for an administrator: its status, where it is from (a tooltip) and its reading label and standing. */
interface OverviewTag {
    wording: Wording
    source: string | null
    reading: string | null
    readingStatus: string | null
}

interface OverviewTags {
    purpose?: OverviewTag
    game?: OverviewTag
    parameters?: OverviewTag
    /** Polish pass P1: per served group, per line. */
    groups: (OverviewTag | undefined)[][]
    unmatched: number
}

/** Where a presented sentence is from, on one line for a tooltip: the source's own fields as sent. Null where it names none. */
function sourceLine(source: unknown): string | null {
    if (!source || typeof source !== 'object') return null
    const fields = ['kind', 'table', 'id', 'column']
        .map((key) => (source as Record<string, unknown>)[key])
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    return fields.length > 0 ? fields.join(' ') : null
}

/**
 * Whose wording each overview sentence is, for an administrator (stage 4). Read from the overview as presented (`overviewDraft.presented`:
 * each sentence's status, source and reading label) and joined to what every viewer is served (`overview`) by part and words: the purpose,
 * the game and the parameters by their words; a scoring line (polish pass P1) within its team's group, the presented group under the same
 * heading at the same place, by its words, and only where exactly one sentence of that group matches. A line matching none, or several,
 * gets no tag and is counted, as in `wordingBySentence`: a wrong tag is worse than none. Null for a coach, whose answer carries no draft.
 */
function overviewTags(overview: CoachOverview, draft: ReviewOverviewDraft | undefined): OverviewTags | null {
    const presented = draft?.presented
    if (!presented) return null
    let unmatched = 0
    type Presented = { text: string; wording: Wording; source?: unknown; reading?: { label: string; status?: string } | null }
    const tagOf = (sentence: Presented | null | undefined, text: string): OverviewTag | undefined => {
        if (!sentence || sentence.text !== text || !isKnownWording(sentence.wording)) {
            unmatched += 1
            return undefined
        }
        return { wording: sentence.wording, source: sourceLine(sentence.source), reading: sentence.reading?.label ?? null, readingStatus: sentence.reading?.status ?? null }
    }
    const presentedGroups = presented.scoring ?? []
    const groups = overview.scoring.groups.map((group, index) => {
        const own = presentedGroups[index]?.label === group.label ? presentedGroups[index].sentences ?? [] : []
        return group.lines.map((line) => {
            const candidates = own.filter((sentence) => sentence.text === line.text)
            return tagOf(candidates.length === 1 ? candidates[0] : null, line.text)
        })
    })
    return {
        purpose: overview.purpose === null ? undefined : tagOf(presented.purpose, overview.purpose),
        game: tagOf(presented.game, overview.game),
        parameters: tagOf(presented.parameters, overview.parameters),
        groups,
        unmatched,
    }
}

/**
 * The Coach Details sentence a pointer leads to: the served instruction with the pointer's section and words, resolved here by both and
 * never by position (stage 3D). -1 where none has them; the link then opens Coach details at its top.
 */
function sentenceOfPointer(activity: ServedActivity, pointer: OverviewPointer): number {
    return activity.rendered.instructions.findIndex((instruction) => instruction.section === pointer.section && instruction.text === pointer.text)
}

/**
 * A link to the Details sentence a pointer names (stage 4): by default the pointer's own label (DRAFT, the server's: "full rule"), on the
 * line it qualifies; with `bySection` (polish pass P3), the name of the Coach details section it opens, after `MORE_IN_DETAILS`.
 */
function FullRuleLink({ pointer, href, onFollow, bySection = false }: { pointer: OverviewPointer; href: string; onFollow: (pointer: OverviewPointer) => void; bySection?: boolean }) {
    return (
        <a
            href={href}
            onClick={(event) => {
                event.preventDefault()
                onFollow(pointer)
            }}
            className='text-xs font-medium text-blue-700 underline whitespace-nowrap underline-offset-2 hover:text-blue-900'
        >
            {bySection ? pointer.section : pointer.label}
        </a>
    )
}

/**
 * "More in Coach details:" and a link per pointer, named by the section it opens (polish pass P3, the Stage 4 review: the trailing "full
 * rule (How it works)" was cryptic). Under a team's group for that team's pointers; once after the groups for every team's.
 */
function MoreInDetails({
    pointers,
    hrefOf,
    onFollow,
    forTeams,
}: {
    pointers: OverviewPointer[]
    hrefOf: (pointer: OverviewPointer) => string
    onFollow: (pointer: OverviewPointer) => void
    /** Set for the pointers every team's group shares: says whom they are for, so they never read as the last team's (DRAFT words). */
    forTeams?: number
}) {
    if (!pointers.length) return null
    const lead = forTeams ? `For ${forTeams === 2 ? 'both teams' : 'every team'}, more in ${OVERVIEW_HEADINGS.details}:` : MORE_IN_DETAILS
    return (
        <p className='mt-1.5 text-xs text-gray-600'>
            {lead}{' '}
            {pointers.map((pointer, index) => (
                <span key={`${pointer.section}|${pointer.text}`}>
                    {index > 0 && ' · '}
                    <FullRuleLink pointer={pointer} href={hrefOf(pointer)} onFollow={onFollow} bySection />
                </span>
            ))}
        </p>
    )
}

/**
 * The approved terms among the field diagram's words (polish pass P5): every word of the administrator's model whose status is HIS_TERM,
 * read from the model (never typed here), each once, in the order the model holds them.
 */
function approvedDiagramTerms(draft: ReviewDiagramDraft): string[] {
    const found: string[] = []
    const visit = (value: unknown) => {
        if (Array.isArray(value)) value.forEach(visit)
        else if (value && typeof value === 'object') {
            const word = value as { text?: unknown; status?: unknown }
            if (word.status === 'HIS_TERM' && typeof word.text === 'string') {
                if (!found.includes(word.text)) found.push(word.text)
                return
            }
            Object.values(value).forEach(visit)
        }
    }
    visit(draft.diagram)
    return found
}

/**
 * The diagram, for an administrator only (stage 5B): where the server withheld it, every finding as given (D0-D9) and that coaches see
 * none; where it is drawn, that its words are proposed except the approved terms the model marks so (polish pass P5, the 5B review), and
 * what it does not draw, as the server notes it. The notes and findings carry internal ids: never a coach's. Wording around them is DRAFT.
 */
function DiagramAdminNote({ draft }: { draft: ReviewDiagramDraft }) {
    const findings = Array.isArray(draft.findings) ? draft.findings : []
    const notes = Array.isArray(draft.notes) ? draft.notes : []
    if (draft.served) {
        const terms = approvedDiagramTerms(draft)
        return (
            <div role='note' className='p-3 mt-2 text-xs text-gray-600 border border-gray-200 rounded-lg bg-gray-50'>
                <p>
                    {terms.length > 0
                        ? `Field diagram words are proposed wording, except the approved terms ${terms.map((term) => `“${term}”`).join(' and ')}.`
                        : 'Every field diagram word is proposed wording.'}{' '}
                    (Administrators only.)
                </p>
                {notes.length > 0 && (
                    <>
                        <p className='mt-2 font-medium'>Not drawn in the field diagram:</p>
                        <ul className='mt-1 space-y-0.5 list-disc list-inside [overflow-wrap:anywhere]'>
                            {notes.map((note, index) => (
                                <li key={index}>{note}</li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        )
    }
    return (
        <div role='note' className='p-3 mt-2 text-xs border rounded-lg text-amber-900 bg-amber-50 border-amber-200'>
            <p className='font-medium'>Field diagram withheld: coaches see no diagram. (Administrators only.)</p>
            {findings.length > 0 ? (
                <ul className='mt-1 space-y-0.5 list-disc list-inside [overflow-wrap:anywhere]'>
                    {findings.map((finding, index) => (
                        <li key={index}>{`${finding.rule}${finding.blockId ? ` (${finding.blockId})` : ''}: ${finding.what}`}</li>
                    ))}
                </ul>
            ) : (
                <p className='mt-1'>The server gave no reason.</p>
            )}
        </div>
    )
}

/**
 * Why the overview is not shown, for an administrator only (stage 4): the server withheld it, so the activity is the Coach Details alone.
 * Every reason the server gave is listed as given: the agreement check's violations, what could not be composed, and why the essentials
 * table or the readings record could not be used. Wording around them is DRAFT.
 */
function WithheldOverviewNote({ draft }: { draft: ReviewOverviewDraft }) {
    const reasons = [
        ...(draft.check?.findings ?? []).filter((finding) => finding.severity === 'VIOLATION').map((finding) => `Q${finding.question}${finding.blockId ? ` (${finding.blockId})` : ''}: ${finding.what}`),
        ...(draft.gaps ?? []).map((gap) => `${gap.part}: ${gap.what}`),
        ...(draft.scoring?.table?.why ? [`Essentials table: ${draft.scoring.table.why}`] : []),
        ...(draft.scoring?.readings?.why ? [`Readings record: ${draft.scoring.readings.why}`] : []),
    ]
    return (
        <div role='note' className='p-3 mt-4 text-xs border rounded-lg text-amber-900 bg-amber-50 border-amber-200'>
            <p className='font-medium'>Coach Overview withheld: coaches see the Coach details below on their own. (Administrators only.)</p>
            {reasons.length > 0 ? (
                <ul className='mt-1 space-y-0.5 list-disc list-inside [overflow-wrap:anywhere]'>
                    {reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                    ))}
                </ul>
            ) : (
                <p className='mt-1'>The server gave no reason.</p>
            )}
        </div>
    )
}

/**
 * THE ACTIVITY, AS A COACH WOULD PRINT IT. Title, the one-line definition, then each section as plain
 * bullets — and nothing else. Since 14 October 2026 the activity is a starting setup with a separate adjusting
 * part below a divider ("Adjusting the activity"), where the server puts ranges, preferences and the limits of a
 * value the activity only starts at.
 *
 * Only `text` is read. An instruction also carries its status and the game paths it came from; those hold
 * internal handles (measured on the possession game: `space.regions[c:restated:GF2:GF2-03.e]...`) and are
 * shown in the account below, never here.
 *
 * The one addition is for an administrator only: where the response carries the review evidence, each sentence is
 * tagged with whose wording it is (see `wordingBySentence`), and so is each section label since the review of stage 2A
 * (see `wordingByLabel`). The tag says one of his three status names and nothing more — no register row or other internal
 * handle. A coach's response has no evidence, and the block renders without tags.
 *
 * STAGE 4 (22 October 2026): THE OVERVIEW FIRST, THE DETAILS WHEN NEEDED. Christian, reply filed 22 October 2026, item 1:
 * "Coach Overview — The immediate understanding of the activity: learning purpose, one-sentence game description, basic
 * parameters, essential scoring objectives, and a simple diagram. Coach Details — The complete instructions organized by
 * function". Where the server serves an overview (`activity.overview`, every viewer's), it comes first: Learning purpose, The
 * game, the parameters line, the field diagram where the server serves one (stage 5B, `activity.diagram`), How each team
 * scores — since polish pass P1 each team's group under its heading, its line first, then its own qualifications, as served —
 * and then "Coach details", one region closed until opened (always in the page, hidden while closed), holding every section in
 * order with no collapse inside it. A "full rule" link, or a section link after "More in Coach details:" (P3), opens that
 * region and goes to the Details sentence its pointer names, found by section and words; the sentence keeps a focus ring while
 * it holds the focus (P6). Where the server withholds the overview, the activity is the Coach Details alone, open, and an
 * administrator is told why. The page adds no words of its own to the overview beyond its headings and that lead-in, and puts
 * nothing in it that the server did not serve.
 *
 * For an administrator only: each overview sentence's status (one of his three names), its reading label where an extract of
 * his wording stands by a recorded reading (C1: approved or PROPOSED), the essentials table's label (C1: which of its rules he approved
 * and which remain PROPOSED), and a legend. A coach sees none of these.
 */
export function ActivityBlock({ activity }: { activity: ServedActivity }) {
    const instructions = activity.rendered.instructions
    // The starting setup and playing instructions first; what a coach may adjust below a divider (14 October 2026).
    const grouped = groupBySection(instructions)
    const sections = grouped.filter((group) => group.section !== ADJUSTING_SECTION)
    const adjusting = grouped.find((group) => group.section === ADJUSTING_SECTION)
    const wording = wordingBySentence(activity)
    const labels = wordingByLabel(activity)
    const overview = activity.overview ?? null
    const draft = activity.overviewDraft
    const tags = overview ? overviewTags(overview, draft) : null
    const administrator = !!draft || !!wording
    /**
     * The essentials table's label (stage 3C), the server's DRAFT words: built on a PROPOSED table, or (C1, his reply filed 24 October 2026,
     * item 2) on a partly approved one, naming the rules he approved and those still PROPOSED. Shown as sent.
     */
    const tableLabel = draft?.scoring?.table?.label ?? null
    const placeOf = new Map(instructions.map((instruction, at) => [instruction, at]))

    /** Each Details sentence's anchor, by its place in `rendered.instructions`; the region's own for a pointer resolving to none. */
    const idBase = useId()
    const anchorOf = (at: number) => `${idBase}details-${at}`
    const detailsId = `${idBase}details`
    const [detailsOpen, setDetailsOpen] = useState(overview === null)
    /** The Details sentence a "full rule" link is going to (-1: the region's top), until the region is open and it is shown. */
    const [goingTo, setGoingTo] = useState<number | null>(null)
    const [highlighted, setHighlighted] = useState<number | null>(null)
    /**
     * The Details sentence a link was followed to (-1: the region itself), for as long as it holds the focus: it keeps a visible focus ring
     * after the short highlight ends (polish pass P6, the Stage 4 review), and loses it with the focus.
     */
    const [followed, setFollowed] = useState<number | null>(null)

    useEffect(() => {
        if (!detailsOpen || goingTo === null) return
        const target = document.getElementById(goingTo >= 0 ? `${idBase}details-${goingTo}` : `${idBase}details`)
        setGoingTo(null)
        if (!target) return
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target.focus({ preventScroll: true })
        setFollowed(goingTo)
        setHighlighted(goingTo >= 0 ? goingTo : null)
    }, [detailsOpen, goingTo, idBase])

    useEffect(() => {
        if (highlighted === null) return
        const timer = window.setTimeout(() => setHighlighted(null), 2500)
        return () => window.clearTimeout(timer)
    }, [highlighted])

    const follow = (pointer: OverviewPointer) => {
        setDetailsOpen(true)
        setGoingTo(sentenceOfPointer(activity, pointer))
    }
    const hrefOf = (pointer: OverviewPointer) => {
        const at = sentenceOfPointer(activity, pointer)
        return `#${at >= 0 ? anchorOf(at) : detailsId}`
    }

    const heading = 'mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase'
    const detailsLine = (instruction: ReviewInstruction, adjust: boolean) => {
        const at = placeOf.get(instruction) ?? -1
        return (
            <li
                key={at}
                id={at >= 0 ? anchorOf(at) : undefined}
                tabIndex={-1}
                onBlur={() => setFollowed((current) => (current === at ? null : current))}
                className={`flex items-start gap-2 text-sm rounded outline-none transition-colors ${adjust ? 'text-gray-500' : 'text-gray-700'} ${
                    highlighted === at ? 'bg-amber-50 ring-2 ring-amber-300' : followed === at && at >= 0 ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                }`}
            >
                <span aria-hidden className={adjust ? 'text-gray-300' : 'text-gray-400'}>
                    &bull;
                </span>
                <span className='min-w-0 leading-relaxed'>
                    {blockLabel(activity, instruction)}
                    {instruction.text}
                    <WordingTag wording={wording?.tags.get(instruction)} />
                </span>
            </li>
        )
    }

    // The region is always in the page, hidden while closed, so the toggle's aria-controls always names an element (polish pass P6).
    const details = (
        <div
            id={detailsId}
            tabIndex={-1}
            hidden={!detailsOpen}
            onBlur={(event) => {
                if (event.target === event.currentTarget) setFollowed((current) => (current === -1 ? null : current))
            }}
            className={`space-y-5 rounded outline-none ${followed === -1 ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`}
        >
            {sections.map((group) => (
                <div key={group.section}>
                    <p className={heading}>
                        {group.section}
                        <LabelTag wording={labels?.get(group.section)} />
                    </p>
                    <ul className='space-y-1'>{group.lines.map((instruction) => detailsLine(instruction, false))}</ul>
                </div>
            ))}

            {/*
              * What a coach may change from the starting setup, kept apart from it (his §7). Its heading is the
              * server's section name and its lead line is static coach wording — both DRAFTS for his approval.
              * A divider, not a collapse: Coach details hold no collapse inside them (stage 4).
              */}
            {adjusting && (
                <div className='pt-4 border-t border-gray-200'>
                    <p className={heading}>
                        {adjusting.section}
                        <LabelTag wording={labels?.get(adjusting.section)} />
                    </p>
                    <p className='mb-2 text-sm text-gray-500'>{ADJUSTING_LEAD}</p>
                    <ul className='space-y-1'>{adjusting.lines.map((instruction) => detailsLine(instruction, true))}</ul>
                </div>
            )}
        </div>
    )

    return (
        <article className='min-w-0 bg-white border rounded-lg shadow-sm'>
            {/*
              * Christian, 14 October: unresolved goals "should not be presented as completed learning-design
              * examples … If a provisional output is useful for internal review, please label it explicitly as
              * provisional." Above the activity, so it is read before the activity is. Wording is a DRAFT.
              */}
            {activity.account?.provisional && (
                <div role='note' className='px-4 py-3 text-sm font-medium border-b rounded-t-lg sm:px-6 text-amber-900 bg-amber-100 border-amber-200'>
                    Provisional — the Game Problem for this goal has not been decided, so this is not a completed learning-design example.
                </div>
            )}
            {/*
              * Administrator view only: what the tags mean, read before the sentences they mark. The three meanings are his words (22 October
              * 2026, item 4); everything else here is a DRAFT.
              */}
            {administrator && (
                <div role='note' className='px-4 py-2 space-y-1 text-xs text-gray-600 border-b border-gray-100 sm:px-6'>
                    <ul className='flex flex-wrap gap-x-4 gap-y-1'>
                        {Object.entries(WORDING_STATUS).map(([status, { meaning }]) => (
                            <li key={status}>
                                <WordingTag wording={status} flush /> {meaning}
                            </li>
                        ))}
                    </ul>
                    <p>
                        Headings (team headings among them), &ldquo;full rule&rdquo; links and &ldquo;{MORE_IN_DETAILS}&rdquo; are proposed wording. Coaches see no tags, labels or notes
                        for administrators.
                    </p>
                    {/*
                      * The Coach details line, only where this answer carries the review evidence the Details tags are read from (polish pass P6,
                      * the Stage 4 review: a demonstration's answer carries none, and its Details are untagged).
                      */}
                    {wording && <p>Coach details sentences and section headings are tagged too.</p>}
                    {wording && wording.unmatched > 0 && (
                        <p>
                            {wording.unmatched} Coach details sentence{wording.unmatched === 1 ? '' : 's'} could not be matched to the review evidence and{' '}
                            {wording.unmatched === 1 ? 'carries' : 'carry'} no tag.
                        </p>
                    )}
                    {tags && tags.unmatched > 0 && (
                        <p>
                            {tags.unmatched} overview sentence{tags.unmatched === 1 ? '' : 's'} could not be matched to the overview as presented and{' '}
                            {tags.unmatched === 1 ? 'carries' : 'carry'} no tag.
                        </p>
                    )}
                </div>
            )}
            <div className='p-4 sm:p-6'>
                {activity.kind === 'mechanism-demonstration' && <DemonstrationLabel />}
                <h2 className='text-xl font-bold leading-tight text-gray-800'>{activity.title}</h2>
                {/* The Coach Definition is the learning purpose where an overview is shown: said once, under its heading. */}
                {activity.subtitle && activity.subtitle !== overview?.purpose && <p className='mt-2 leading-relaxed text-gray-700'>{activity.subtitle}</p>}

                {overview && (
                    <div className='mt-5 space-y-5'>
                        {overview.purpose !== null && (
                            <div>
                                <p className={heading}>{OVERVIEW_HEADINGS.purpose}</p>
                                <p className='leading-relaxed text-gray-800'>
                                    {overview.purpose}
                                    <WordingTag wording={tags?.purpose?.wording} note={tags?.purpose?.source} />
                                </p>
                            </div>
                        )}
                        <div>
                            <p className={heading}>{OVERVIEW_HEADINGS.game}</p>
                            <p className='leading-relaxed text-gray-800'>
                                {overview.game}
                                <WordingTag wording={tags?.game?.wording} note={tags?.game?.source} />
                            </p>
                            <p className='mt-2 text-sm font-medium text-gray-700'>
                                {overview.parameters}
                                <WordingTag wording={tags?.parameters?.wording} note={tags?.parameters?.source} />
                            </p>
                        </div>
                        {/*
                          * The diagram (stage 5B), between the parameters and how each team scores, as he listed the overview. Drawn only where
                          * the server serves one, and only what it served; for an administrator, why it is withheld and what it does not draw.
                          * Its place before the scoring is his: reply filed 24 October 2026, item 4, "I approve placing the diagram before the
                          * detailed scoring explanation."
                          */}
                        {activity.diagram && <FieldDiagram diagram={activity.diagram} />}
                        {activity.diagramDraft && <DiagramAdminNote draft={activity.diagramDraft} />}
                        <OverviewScoring overview={overview} tags={tags} tableLabel={draft ? tableLabel : null} heading={heading} hrefOf={hrefOf} onFollow={follow} />
                    </div>
                )}
                {!overview && draft && <WithheldOverviewNote draft={draft} />}
                {/*
                  * The diagram is its own layer (stage 5B): where the overview is withheld and the diagram is not, it is drawn above the
                  * Coach details, which are then the whole activity.
                  */}
                {!overview && (activity.diagram || activity.diagramDraft) && (
                    <div className='mt-5'>
                        {activity.diagram && <FieldDiagram diagram={activity.diagram} />}
                        {activity.diagramDraft && <DiagramAdminNote draft={activity.diagramDraft} />}
                    </div>
                )}

                {/*
                  * "Coach details": one region. Closed until opened where an overview comes first; open, with no toggle, where the
                  * overview is withheld and the details are the whole activity.
                  */}
                <section className={`mt-6 border-t border-gray-200 ${overview ? '' : 'pt-3'}`} aria-labelledby={`${idBase}details-heading`}>
                    {overview ? (
                        <h3 id={`${idBase}details-heading`} className='text-base font-semibold text-gray-800'>
                            <button
                                type='button'
                                aria-expanded={detailsOpen}
                                aria-controls={detailsId}
                                onClick={() => setDetailsOpen((open) => !open)}
                                className='flex items-center justify-between w-full gap-2 py-3 text-left min-h-[44px]'
                            >
                                <span>{OVERVIEW_HEADINGS.details}</span>
                                {detailsOpen ? <ChevronUpIcon aria-hidden className='w-5 h-5 text-gray-500' /> : <ChevronDownIcon aria-hidden className='w-5 h-5 text-gray-500' />}
                            </button>
                        </h3>
                    ) : (
                        <h3 id={`${idBase}details-heading`} className='mb-3 text-base font-semibold text-gray-800'>
                            {OVERVIEW_HEADINGS.details}
                        </h3>
                    )}
                    {details}
                </section>
            </div>
        </article>
    )
}

/**
 * How each team scores, as served (polish pass P1, 22 October 2026): each team's group under its heading (the server's DRAFT words), its
 * line saying how it scores first, then its own qualifications, each "full rule" link on the line it qualifies; then that team's pointers no
 * line carries, after "More in Coach details:" (P3); and after the groups, once, the pointers every team's group has. The words and their
 * order are the server's; the page adds only the lead-in. For an administrator, each line's status and reading label, and the PROPOSED
 * essentials table's label under the heading. Was (stage 4): every team's line, then all qualifications, then the trailing pointers.
 */
function OverviewScoring({
    overview,
    tags,
    tableLabel,
    heading,
    hrefOf,
    onFollow,
}: {
    overview: CoachOverview
    tags: OverviewTags | null
    tableLabel: string | null
    heading: string
    hrefOf: (pointer: OverviewPointer) => string
    onFollow: (pointer: OverviewPointer) => void
}) {
    const groupId = useId()
    const item = (line: OverviewLine, tag: OverviewTag | undefined, lead: boolean, key: string) => (
        <li key={key} className={`flex items-start gap-2 text-sm ${lead ? 'text-gray-900' : 'text-gray-700'}`}>
            <span aria-hidden className='text-gray-400'>
                &bull;
            </span>
            <span className='min-w-0 leading-relaxed'>
                {line.text}
                {line.fullRule && (
                    <>
                        {' '}
                        <FullRuleLink pointer={line.fullRule} href={hrefOf(line.fullRule)} onFollow={onFollow} />
                    </>
                )}
                <WordingTag wording={tag?.wording} note={tag?.source} />
                <ReadingTag label={tag?.reading} status={tag?.readingStatus} />
            </span>
        </li>
    )
    return (
        <div>
            <p className={heading}>{OVERVIEW_HEADINGS.scoring}</p>
            {tableLabel && <p className='mb-2 text-xs text-amber-900 [overflow-wrap:anywhere]'>{tableLabel}</p>}
            <div className='space-y-3'>
                {overview.scoring.groups.map((group, index) => (
                    <div key={`${index}-${group.label}`}>
                        {/* The team heading: the server's DRAFT words (the team's noun, or "Each team"); the list is named by it. Where the
                            group's first line already opens with those words ("Building team: Score by ..."), the heading is kept for
                            screen readers only, so the eye does not read the team twice. */}
                        <p
                            id={`${groupId}group-${index}`}
                            className={
                                group.lines[0]?.text.toLowerCase().startsWith(`${group.label.toLowerCase()}:`)
                                    ? 'sr-only'
                                    : 'mb-1 text-sm font-semibold text-gray-800'
                            }
                        >
                            {group.label}
                        </p>
                        <ul aria-labelledby={`${groupId}group-${index}`} className='space-y-1.5'>
                            {group.lines.map((line, n) => item(line, tags?.groups[index]?.[n], n === 0, `line-${index}-${n}`))}
                        </ul>
                        <MoreInDetails pointers={group.fullRules} hrefOf={hrefOf} onFollow={onFollow} />
                    </div>
                ))}
            </div>
            {/* Every team's pointers, once, set apart from the last team's group by a rule so they do not read as that team's. */}
            {overview.scoring.fullRules.length > 0 && (
                <div className='pt-1 mt-3 border-t border-gray-200'>
                    <MoreInDetails
                        pointers={overview.scoring.fullRules}
                        hrefOf={hrefOf}
                        onFollow={onFollow}
                        forTeams={overview.scoring.groups.length}
                    />
                </div>
            )}
        </div>
    )
}
