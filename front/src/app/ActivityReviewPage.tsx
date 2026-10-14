/**
 * The signed-in activity review: the activity a coach would receive, built from THEIR session.
 *
 * Christian, 13 October: "The review page should accept any of the thirteen Learning Goals and use the
 * coach's actual session context. Goalkeeper availability should come from the Team Profile or session
 * configuration, with the coach able to confirm or adjust it. The system should not silently assume that
 * no goalkeepers are available. Where an activity cannot be generated, I'd prefer a brief, understandable
 * explanation rather than a generic failure. Please keep the actual coach-facing activity primary, with
 * its selection rationale and technical evidence available separately."
 *
 * Each sentence of that is one rule here:
 *
 *   * THE SESSION IS THE COACH'S. Players and playing area are read from the stored session and shown as
 *     entered. This page does not edit them and does not fill one in when it is missing — the server
 *     refuses with a sentence naming what is missing, and that sentence is what the coach reads.
 *   * NOTHING IS ASSUMED ABOUT A SPECIALIZED ROLE. The availability inputs start from the session's stored
 *     answer when there is one and EMPTY when there is not. An empty box is "not stated", which is not
 *     zero, and Build stays disabled until every role has a number the coach typed or the session held.
 *   * THE ACTIVITY IS PRIMARY. Title, the one-line definition, then the instruction text under its
 *     sections — nothing else. Only `text` is shown there: an instruction's status and source paths carry
 *     internal handles and belong to the account.
 *   * A REFUSAL IS AN ANSWER. It arrives in a 2xx body (the service layer strips non-2xx bodies) and is
 *     shown as the server's one plain sentence. No stage name, no id and no check name in that block.
 *   * EVERYTHING TECHNICAL IS SECONDARY, in one panel that is closed until the reader opens it.
 *
 * NO LEARNING GOAL, DEMONSTRATION OR ROLE IS NAMED IN THIS FILE. All three lists come from the review
 * endpoint, as the planning conversation's come from its registry. If one appears below as a string
 * literal, knowledge has leaked into the page.
 *
 * The page performs no transformation of the activity. It groups instructions by the section each one
 * already carries and prints them in the order the server sent them.
 */
import { ArrowLeftCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { NumberField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import {
    ActivityAccount,
    ActivityReviewOptions,
    ActivityReviewRequest,
    ActivityReviewResult,
    RefusedActivity,
    ReviewInstruction,
    ServedActivity,
} from '@/MODELS/activity-review.model'
import { ISession } from '@/MODELS/session.model'

import { api } from '@/services/api.service'
import { useResource } from '@/services/resource.service'

import Button from '@/components/Button'
import Loading from '@/components/Loading'

import { DURATION_OPTIONS } from './SessionPlanningConversation'

/** The order a coach reads an activity in. Organisation only — the section name comes from the server. */
const SECTION_ORDER = ['Set up', 'Players', 'How it works', 'How to score', 'What to watch']

/**
 * What each instruction status means, for the account. Wording follows the renderer's own definitions.
 * A status this map does not know is shown as the server sent it, never hidden.
 */
const STATUS_MEANING: Record<string, string> = {
    DERIVED: 'required by the game',
    REALIZATION_CHOICE: 'chosen for this activity',
    PREFERENCE: 'suggested, not required',
    INSTANTIATED: 'made concrete for this activity',
    SESSION: 'from your session',
}

type ReviewChoice = { kind: 'learning-goal' | 'mechanism-demonstration'; id: string }

/** A stated availability is a whole number of people, zero included. Anything else is not stated. */
const isStatedCount = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0

const isReviewResult = (data: unknown): data is ActivityReviewResult => {
    const candidate = data as ActivityReviewResult | null
    if (!candidate || typeof candidate !== 'object') return false
    if (candidate.outcome === 'refused') return true
    return candidate.outcome === 'served' && Array.isArray(candidate.rendered?.instructions)
}

/**
 * The instructions under their sections: the five known sections in reading order, then any section the
 * server sent that this page has not heard of, in the order it first appears.
 *
 * The second half is the point. A fixed list of five would silently drop every instruction filed under a
 * sixth, and the coach would be handed an activity with a rule missing and nothing to say so.
 */
function groupBySection(instructions: ReviewInstruction[]): { section: string; lines: ReviewInstruction[] }[] {
    const sections = [...SECTION_ORDER]
    for (const instruction of instructions) {
        if (!sections.includes(instruction.section)) sections.push(instruction.section)
    }
    return sections
        .map((section) => ({ section, lines: instructions.filter((instruction) => instruction.section === section) }))
        .filter((group) => group.lines.length > 0)
}

export default function ActivityReviewPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [session, , sessionResource] = useResource<ISession>(`${ROUTES.app.session}/${id}`)
    const [options, , optionsResource] = useResource<ActivityReviewOptions>(ROUTES.app.checkedActivity)

    const [duration, setDuration] = useState<number | null>(null)
    /** Role name -> stated availability. `undefined` is "not stated" and is never sent as a number. */
    const [availability, setAvailability] = useState<Record<string, number | undefined>>({})
    const [choice, setChoice] = useState<ReviewChoice | null>(null)
    const [result, setResult] = useState<ActivityReviewResult | null>(null)
    const [requestError, setRequestError] = useState<string | null>(null)
    const resultRef = useRef<HTMLDivElement>(null)

    /**
     * The brief types this list as `string[]` for the page and as `{ role }[]` for the route. The two
     * halves were built in parallel, so both shapes are read rather than one being guessed.
     */
    const roleNames = useMemo(
        () =>
            (Array.isArray(options?.specializedRoles) ? options.specializedRoles : [])
                .map((entry) => (typeof entry === 'string' ? entry : entry?.role))
                .filter((role): role is string => typeof role === 'string' && role.length > 0),
        [options]
    )

    /**
     * The options are usable only if BOTH lists the page depends on arrived as lists.
     *
     * The role list is the one that matters. If it came back missing or under another name and the page
     * carried on, it would ask about no role at all, enable Build, and send an empty statement — the
     * question this page exists to ask would have vanished without an error anywhere. An EMPTY list is a
     * real answer (a register naming no specialized role); an absent one is a broken response, and it is
     * reported as the options failing to load.
     */
    const optionsReadable = !!options && Array.isArray(options.goals) && Array.isArray(options.specializedRoles)

    /** Goals under their phase, both in the order the server returned them. */
    const phases = useMemo(() => {
        const groups: { phase: string; goals: ActivityReviewOptions['goals'] }[] = []
        for (const goal of options?.goals ?? []) {
            let group = groups.find((candidate) => candidate.phase === goal.phase)
            if (!group) {
                group = { phase: goal.phase, goals: [] }
                groups.push(group)
            }
            group.goals.push(goal)
        }
        return groups
    }, [options])

    /**
     * Start each availability input from what the SESSION says, once.
     *
     * Only a stored whole number is carried over. A session with no answer leaves the box empty — it is
     * not given a zero, because a zero the coach never entered is exactly the silent assumption this page
     * exists to remove. A stored zero IS an answer and is shown as one.
     *
     * Guarded by a ref so a later re-fetch cannot overwrite what the coach has since typed here.
     */
    const prefilledFor = useRef<string | null>(null)
    useEffect(() => {
        if (!session?._id || !optionsReadable || prefilledFor.current === session._id) return
        prefilledFor.current = session._id
        const stored = session.specializedRoles ?? {}
        setAvailability(Object.fromEntries(roleNames.map((role) => [role, isStatedCount(stored[role]) ? stored[role] : undefined])))
    }, [session, options, roleNames])

    /**
     * Any change to what was asked removes the answer on screen.
     *
     * The activity shown must be the activity for the inputs shown. Leaving the last result up while the
     * coach changes the goal, the duration or the availability would put one goal's activity under
     * another goal's selection until Build is pressed again.
     *
     * `asked` counts every such change, because clearing the screen is not enough on its own: a request
     * already on its way would land AFTER the change and put the old goal's activity straight back under
     * the new selection. `build` notes the count it started at and drops an answer that arrives to a
     * different one.
     */
    const asked = useRef(0)
    const invalidate = () => {
        asked.current += 1
        setResult(null)
        setRequestError(null)
    }

    const unstatedRoles = roleNames.filter((role) => !isStatedCount(availability[role]))
    const stillNeeded = [
        ...(duration === null ? ['how long the activity runs'] : []),
        ...unstatedRoles.map((role) => `how many ${role}s are available`),
        ...(choice === null ? ['what to build'] : []),
    ]
    const canBuild = stillNeeded.length === 0

    const build = async () => {
        if (!choice || duration === null || unstatedRoles.length > 0) return
        invalidate()
        const askedAt = asked.current

        const request: ActivityReviewRequest = {
            ...(choice.kind === 'learning-goal' ? { learningGoalId: choice.id } : { demonstrationId: choice.id }),
            durationMin: duration,
            roles: Object.fromEntries(roleNames.map((role) => [role, availability[role] as number])),
        }
        const response = await api<ActivityReviewResult>(`${ROUTES.app.checkedActivity}/${id}`, request)

        // Something was changed, or Build was pressed again, while this was on its way: it answers a
        // question that is no longer the one on screen.
        if (askedAt !== asked.current) return

        /**
         * A refusal the coach can act on comes back 200 and is handled below as a result. Reaching this
         * branch means the request itself failed — not found, not theirs, malformed, or no server — and
         * there is no activity and no refusal to show, so the page says only that.
         */
        if (response.error || !isReviewResult(response.data)) {
            setRequestError(
                typeof response.error === 'string' && response.error
                    ? response.error
                    : 'The server did not return an activity or an explanation.'
            )
            return
        }
        setResult(response.data)
        window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    }

    const awaitingFirstAnswer = (resource: { status?: number; error?: string; isLoading?: boolean }) =>
        resource.isLoading || (resource.status === undefined && !resource.error)

    if (awaitingFirstAnswer(sessionResource) || awaitingFirstAnswer(optionsResource)) {
        return (
            <div className='flex flex-col items-center justify-center min-h-screen px-4'>
                <Loading />
                <p className='mt-4 text-gray-600'>Loading session...</p>
            </div>
        )
    }

    const returnToSession = (
        <div
            className='flex items-center self-center gap-2 mt-2 text-sm text-gray-400 transition-colors cursor-pointer hover:text-gray-700'
            onClick={() => navigate(`/session/${id}`)}
        >
            <ArrowLeftCircleIcon className='w-4' />
            <p className='font-normal'>Return to Session</p>
        </div>
    )

    if (!session || !options || !optionsReadable) {
        return (
            <div className='flex flex-col max-w-4xl gap-4 px-2 py-6 mx-auto sm:py-8 sm:px-6'>
                <div className='p-6 border border-red-200 rounded-lg bg-red-50'>
                    <p className='text-red-800'>
                        {!session
                            ? 'We could not load this session. Please refresh to try again.'
                            : 'We could not load the review options. Please refresh to try again.'}
                    </p>
                </div>
                {returnToSession}
            </div>
        )
    }

    const choiceButtonClass = (selected: boolean) =>
        `w-full p-4 text-left border rounded-lg transition hover:border-blue-500 hover:bg-blue-50 ${
            selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
        }`
    const isChosen = (kind: ReviewChoice['kind'], candidateId: string) => choice?.kind === kind && choice.id === candidateId
    const choose = (kind: ReviewChoice['kind'], candidateId: string) => {
        setChoice({ kind, id: candidateId })
        invalidate()
    }

    return (
        <div className='flex flex-col max-w-4xl gap-6 px-2 py-6 mx-auto sm:py-8 sm:px-6'>
            <header>
                <h1 className='pb-2 mb-2 text-xl font-semibold text-gray-800 border-b border-gray-200'>Activity review</h1>
                <p className='text-sm text-gray-600'>
                    The activity a coach would receive for a Learning Goal, built from this session: {session.name || 'Session'}.
                </p>
            </header>

            {/* 1. The session, as the coach entered it. */}
            <section className='bg-white border rounded-lg shadow-sm'>
                <div className='p-6'>
                    <h3 className='mb-4 text-lg font-semibold text-gray-800'>Your session</h3>
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <SessionFact label='Players' value={isStatedCount(session.playerCount) ? `${session.playerCount}` : 'Not set'} />
                        <SessionFact label='Playing area' value={playingAreaInMetres(session.fieldLength, session.fieldWidth)} />
                    </div>

                    <div className='mt-6'>
                        <p className='mb-2 font-medium text-gray-700'>How long is this activity?</p>
                        <div className='flex flex-wrap gap-2'>
                            {DURATION_OPTIONS.map((minutes) => (
                                <button
                                    key={minutes}
                                    type='button'
                                    aria-pressed={duration === minutes}
                                    onClick={() => {
                                        setDuration(minutes)
                                        invalidate()
                                    }}
                                    className={`px-5 py-3 border rounded-lg transition hover:border-blue-500 hover:bg-blue-50 ${
                                        duration === minutes ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                                    }`}
                                >
                                    {minutes} min
                                </button>
                            ))}
                        </div>
                    </div>

                    {roleNames.length > 0 && (
                        <div className='grid grid-cols-1 gap-6 mt-6 md:grid-cols-2'>
                            {roleNames.map((role) => {
                                const stored = session.specializedRoles?.[role]
                                return (
                                    <div key={role}>
                                        <NumberField
                                            label={`How many ${role}s are available today?`}
                                            value={availability[role]}
                                            onChange={(value) => {
                                                // A cleared box reports NaN. That is "not stated", and it
                                                // is stored as such rather than as a number.
                                                setAvailability((current) => ({ ...current, [role]: isStatedCount(value) ? value : undefined }))
                                                invalidate()
                                            }}
                                            min={0}
                                            step={1}
                                            placeholder='Enter a number — 0 if none'
                                            labelClass='text-gray-700 font-medium mb-2 block'
                                            inputClass='text-base'
                                            className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                        />
                                        <p className='mt-2 text-sm text-gray-500'>
                                            {isStatedCount(stored)
                                                ? `Your session says ${stored}. Change it here if today is different — this review only, your session is not changed.`
                                                : 'Your session does not say. Enter it here for this review — your session is not changed.'}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* 2. What to build: a Learning Goal, or — kept visibly apart — a mechanism demonstration. */}
            <section className='bg-white border rounded-lg shadow-sm'>
                <div className='p-6'>
                    {/* The planning conversation's own question, verbatim from the Experience Specification. */}
                    <h3 className='mb-4 text-lg font-semibold text-gray-800'>
                        What are your players trying to handle better during the game?
                    </h3>
                    {phases.map((group) => (
                        <div key={group.phase} className='mb-6'>
                            <h4 className='mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase'>{group.phase}</h4>
                            <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                                {group.goals.map((goal) => (
                                    <button
                                        key={goal.id}
                                        type='button'
                                        aria-pressed={isChosen('learning-goal', goal.id)}
                                        onClick={() => choose('learning-goal', goal.id)}
                                        className={choiceButtonClass(isChosen('learning-goal', goal.id))}
                                    >
                                        <span className='block font-medium text-gray-900'>{goal.name}</span>
                                        {goal.definition && <span className='block mt-1 text-sm text-gray-600'>{goal.definition}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {(options.demonstrations ?? []).length > 0 && (
                        <div className='pt-6 mt-2 border-t border-gray-200'>
                            <h4 className='mb-1 text-sm font-semibold tracking-wide text-gray-500 uppercase'>
                                Mechanism demonstrations — not Learning Goal activities
                            </h4>
                            <p className='mb-3 text-sm text-gray-600'>
                                These show one part of the engine working. They are not built from a Learning Goal.
                            </p>
                            <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                                {options.demonstrations.map((demonstration) => (
                                    <button
                                        key={demonstration.id}
                                        type='button'
                                        aria-pressed={isChosen('mechanism-demonstration', demonstration.id)}
                                        onClick={() => choose('mechanism-demonstration', demonstration.id)}
                                        className={choiceButtonClass(isChosen('mechanism-demonstration', demonstration.id))}
                                    >
                                        <span className='block font-medium text-gray-900'>{demonstration.name}</span>
                                        {demonstration.statement && (
                                            <span className='block mt-1 text-sm text-gray-600'>{demonstration.statement}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className='flex flex-col gap-2'>
                <Button onClickAsync={build} disabled={!canBuild} className='w-full max-w-sm rounded-full sm:self-center'>
                    Build the activity
                </Button>
                {!canBuild && (
                    <p className='text-xs text-center text-gray-600'>Still needed: {stillNeeded.join('; ')}.</p>
                )}
            </div>

            <div ref={resultRef} className='flex flex-col gap-6'>
                {/*
                  * A FAILED REQUEST IS NOT A REFUSAL, and it must not look like one. A refusal is the
                  * engine's considered answer about a goal; this is the page failing to get any answer.
                  * So it takes the load failures' red above, not the refusal's amber below, and it
                  * never borrows the refusal's "cannot be built" sentence.
                  */}
                {requestError && (
                    <div role='alert' className='p-6 border border-red-200 rounded-lg bg-red-50'>
                        <p className='font-medium text-red-800'>The activity could not be requested, so nothing is shown.</p>
                        <p className='mt-1 text-sm text-red-800'>{requestError}</p>
                    </div>
                )}

                {/* 3 and 4. The answer, primary: the activity, or the sentence saying why there is none. */}
                {result?.outcome === 'served' && <ActivityBlock activity={result} />}
                {result?.outcome === 'refused' && <RefusalBlock refusal={result} />}

                {/* 5. Everything technical, secondary. */}
                {result && <ArrivedAt result={result} />}
            </div>

            {returnToSession}
        </div>
    )
}

/**
 * The playing area in metres, as stored.
 *
 * Metres only, unlike the session page's tile: every length in the activity below is in metres, and the
 * figure here is the one the coach should be able to find again in "Mark out an area ...".
 */
function playingAreaInMetres(length?: string, width?: string): string {
    const l = Number(length)
    const w = Number(width)
    if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0) return 'Not set'
    return `${l} m long by ${w} m wide`
}

function SessionFact({ label, value }: { label: string; value: string }) {
    return (
        <div className='p-3 bg-white border border-gray-200 rounded-lg'>
            <p className='mb-1 text-xs font-medium text-gray-500'>{label}</p>
            <p className='text-sm font-semibold text-gray-800'>{value}</p>
        </div>
    )
}

/**
 * Christian, 13 October: "Intermediate mechanism demonstrations are useful, but they should remain clearly
 * identified as such." So the label travels with the result — onto the activity and onto a refusal —
 * rather than staying behind in the picker where it was chosen.
 */
function DemonstrationLabel() {
    return (
        <span className='inline-block px-2 py-1 mb-3 text-xs font-semibold text-indigo-800 bg-indigo-100 rounded-full'>
            Mechanism demonstration
        </span>
    )
}

/**
 * THE ACTIVITY, AS A COACH WOULD PRINT IT. Title, the one-line definition, then each section as plain
 * bullets — and nothing else.
 *
 * Only `text` is read. An instruction also carries its status and the game paths it came from; those hold
 * internal handles (measured on the possession game: `space.regions[c:restated:GF2:GF2-03.e]...`) and are
 * shown in the account below, never here.
 */
function ActivityBlock({ activity }: { activity: ServedActivity }) {
    const sections = groupBySection(activity.rendered.instructions)

    return (
        <article className='bg-white border rounded-lg shadow-sm'>
            <div className='p-6'>
                {activity.kind === 'mechanism-demonstration' && <DemonstrationLabel />}
                <h2 className='text-xl font-bold leading-tight text-gray-800'>{activity.title}</h2>
                {activity.subtitle && <p className='mt-2 leading-relaxed text-gray-700'>{activity.subtitle}</p>}

                <div className='mt-5 space-y-5'>
                    {sections.map((group) => (
                        <div key={group.section}>
                            <p className='mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase'>{group.section}</p>
                            <ul className='space-y-1'>
                                {group.lines.map((instruction, index) => (
                                    <li key={index} className='flex items-start gap-2 text-sm text-gray-700'>
                                        <span aria-hidden className='text-gray-400'>
                                            &bull;
                                        </span>
                                        <span className='leading-relaxed'>{instruction.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </article>
    )
}

/**
 * A refusal, in the coach's words: what cannot be built, and the server's one sentence saying why.
 *
 * The stage and the engine's reasons are deliberately absent. They contain check names and item ids, and
 * they are in the account for anyone who wants them.
 */
function RefusalBlock({ refusal }: { refusal: RefusedActivity }) {
    return (
        <article className='p-6 border rounded-lg border-amber-200 bg-amber-50'>
            {refusal.kind === 'mechanism-demonstration' && <DemonstrationLabel />}
            <h2 className='text-lg font-semibold text-amber-900'>{refusal.title} cannot be built as an activity yet.</h2>
            {refusal.summary && <p className='mt-2 leading-relaxed text-amber-800'>{refusal.summary}</p>}
        </article>
    )
}

function AccountField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className='mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase'>{label}</p>
            <div className='text-sm text-gray-800'>{children}</div>
        </div>
    )
}

function Mark({ positive, children }: { positive: boolean; children: React.ReactNode }) {
    return (
        <span className={`text-[10px] font-bold uppercase ${positive ? 'text-emerald-600' : 'text-amber-600'}`}>{children}</span>
    )
}

/**
 * The Game Problem line of the account.
 *
 * Christian's approved translation is the only thing that may be shown as a goal's Game Problem. Where
 * none is approved the line says so in fixed words and stops: `inferredFromWording` is what the goal's
 * wording alone implies, it is not his decision, and printing it under this heading would present an
 * inference as the answer. It appears only beside an APPROVED Game Problem it disagrees with, labelled
 * as the wording's reading, because that disagreement is what the field is recorded for.
 */
function GameProblemLine({ gameProblem, kind }: { gameProblem: ActivityAccount['gameProblem']; kind: ActivityReviewResult['kind'] }) {
    if (gameProblem === null) {
        // Null is the contract's value for a demonstration. For a goal it can only mean the account
        // stopped before selection, and saying "none" there would state a finding nobody made.
        return kind === 'mechanism-demonstration' ? (
            <>None — a mechanism demonstration is not built from a Learning Goal.</>
        ) : (
            <>Not established before this stopped.</>
        )
    }
    if (gameProblem.status !== 'APPROVED') {
        return <>Not yet decided — an open learning-design decision</>
    }
    return (
        <>
            {gameProblem.name ?? gameProblem.gameProblemId}
            {gameProblem.name && gameProblem.gameProblemId && <span className='text-gray-500'> ({gameProblem.gameProblemId})</span>}
            <span className='block mt-0.5 text-xs text-gray-500'>
                Approved.
                {gameProblem.governed &&
                    gameProblem.inferredFromWording &&
                    ` It governed selection: the goal's wording on its own pointed to ${gameProblem.inferredFromWording}.`}
            </span>
        </>
    )
}

/**
 * "HOW THIS WAS ARRIVED AT" — secondary, and closed until someone opens it.
 *
 * Everything here is the server's account, shown as sent: ids, check names, property paths and the
 * engine's reasons verbatim. It is for the person checking the activity, not the person running it, which
 * is why none of it is in the block above.
 *
 * Fields are read defensively. A refusal carries only the part of the account that was established
 * before it stopped, so every row is rendered if present and omitted if not — an absent row means "not
 * reached", and a placeholder there would read as a finding.
 */
function ArrivedAt({ result }: { result: ActivityReviewResult }) {
    const [open, setOpen] = useState(false)
    const account: Partial<ActivityAccount> = result.account ?? {}
    const served = result.outcome === 'served' ? result : null
    const refused = result.outcome === 'refused' ? result : null

    const constraints = account.constraints ?? []
    /**
     * `selectedWithoutContract` is listed in full only where `constraints` does not already carry the
     * entry. The two overlap by design, and matching is by id or by id ending at a hyphen, because the
     * builder has served these ids both with and without their library prefix.
     *
     * An entry is left out ONLY where the row it matches already reads "Selected, not yet built". If the
     * matching row is marked as built, the two lists disagree about the same object, and the entry is
     * shown as well: dropping it would leave the reassuring mark standing alone. A bare `endsWith` did
     * that, and it also matched an empty entry against every row.
     */
    const sameObject = (constraintId: string, entry: string) =>
        entry.length > 0 && (constraintId === entry || constraintId.endsWith(`-${entry}`) || entry.endsWith(`-${constraintId}`))
    const alsoWithoutContract = (account.selectedWithoutContract ?? []).filter(
        (entry) => !constraints.some((constraint) => !constraint.contracted && sameObject(String(constraint.id), String(entry)))
    )
    /**
     * Observations are plain sentences in the renderer (`coachingObservations: string[]`), and the brief
     * also describes them as `{ text }` objects. Both are read: an object handed to React as a child
     * throws, and a thrown render blanks the whole page — activity included — for the sake of a note.
     */
    const asSentence = (value: unknown): string =>
        typeof value === 'string'
            ? value
            : typeof (value as { text?: unknown } | null)?.text === 'string'
              ? (value as { text: string }).text
              : JSON.stringify(value)
    const observations: unknown[] = served?.rendered.coachingObservations ?? served?.rendered.observations ?? []
    const integrity = served?.integrity
    const knownIntegrityKeys = ['gateA', 'realizationAuthorized', 'acceptance', 'postRealizationValidated', 'instructions', 'fidelityViolations']
    const yesNo = (value: unknown) => (value === true ? 'Yes' : value === false ? 'No' : String(value))

    return (
        <section className='bg-white border rounded-lg shadow-sm'>
            <div className='p-6'>
                <div className='flex items-center justify-between gap-4'>
                    <h3 className='text-lg font-semibold text-gray-800'>How this was arrived at</h3>
                    <button
                        type='button'
                        aria-expanded={open}
                        onClick={() => setOpen((current) => !current)}
                        className='inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900'
                    >
                        {open ? (
                            <>
                                <ChevronUpIcon className='w-4 h-4' />
                                Hide
                            </>
                        ) : (
                            <>
                                <ChevronDownIcon className='w-4 h-4' />
                                Show
                            </>
                        )}
                    </button>
                </div>

                {open && (
                    <div className='mt-5 space-y-5'>
                        {refused && (
                            <>
                                <AccountField label='Where it stopped'>{refused.stage}</AccountField>
                                <AccountField label="The engine's reasons, as it gave them">
                                    {(refused.reasons ?? []).length > 0 ? (
                                        <ul className='space-y-1'>
                                            {refused.reasons.map((reason, index) => (
                                                <li key={index} className='font-mono text-xs break-words whitespace-pre-wrap text-gray-700'>
                                                    {asSentence(reason)}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        'None were given.'
                                    )}
                                </AccountField>
                            </>
                        )}

                        {account.gameProblem !== undefined && (
                            <AccountField label='Game Problem'>
                                <GameProblemLine gameProblem={account.gameProblem} kind={result.kind} />
                            </AccountField>
                        )}

                        {account.context ? (
                            <AccountField label='Context'>
                                <span className='mr-2'>
                                    {account.context.name ?? account.context.id}
                                    {account.context.name && <span className='text-gray-500'> ({account.context.id})</span>}
                                </span>
                                {account.context.approvedScoringCondition && (
                                    <span className='block mt-1 text-xs text-gray-600'>
                                        Approved scoring condition: {account.context.approvedScoringCondition}{' '}
                                        <Mark positive={account.context.inThisActivity}>
                                            {account.context.inThisActivity ? 'Applied in this activity' : 'Not yet applied in this activity'}
                                        </Mark>
                                    </span>
                                )}
                            </AccountField>
                        ) : (
                            account.contextId !== undefined && <AccountField label='Context'>{account.contextId ?? 'None'}</AccountField>
                        )}

                        {account.gameForm && (
                            <AccountField label='Game form'>
                                <span className='mr-2'>
                                    {account.gameForm.name ?? account.gameForm.id}
                                    {account.gameForm.name && <span className='text-gray-500'> ({account.gameForm.id})</span>}
                                </span>
                                <Mark positive={account.gameForm.contracted}>
                                    {account.gameForm.contracted ? 'Built into the engine' : 'Not yet built into the engine'}
                                </Mark>
                            </AccountField>
                        )}

                        {Array.isArray(account.affordanceLenses) && (
                            <AccountField label='Affordance lenses'>
                                {account.affordanceLenses.length > 0 ? account.affordanceLenses.join(', ') : 'None selected'}
                            </AccountField>
                        )}

                        {(account.constraints !== undefined || alsoWithoutContract.length > 0) && (
                            <AccountField label='Constraints selected'>
                                {/*
                                  * Where selection set the goal's own candidates aside, say so before the list:
                                  * a constraint that was never a candidate for the goal cannot be read as
                                  * relevant to it, and the marks below are only meaningful with that said.
                                  */}
                                {account.constraintSource?.source === 'WHOLE_LIBRARY' && account.constraintSource.setAsideBecause && (
                                    <p className='mb-2 text-xs text-amber-700'>
                                        {account.constraintSource.setAsideBecause === 'FEWER_THAN_TWO'
                                            ? "This goal has fewer than two candidate constraints, so selection drew from the whole library."
                                            : `This goal's candidate constraints include no ${account.constraintSource.missingRoles.join(' or ')} constraint, so selection drew from the whole library.`}
                                    </p>
                                )}
                                {constraints.length + alsoWithoutContract.length > 0 ? (
                                    <ul className='space-y-1'>
                                        {constraints.map((constraint) => (
                                            <li key={constraint.id}>
                                                <span className='mr-2'>
                                                    {constraint.title || constraint.id}
                                                    {constraint.title && <span className='text-gray-500'> ({constraint.id})</span>}
                                                </span>
                                                {/* On a refusal no game exists for a constraint to have shaped. */}
                                                <Mark positive={constraint.contracted}>
                                                    {constraint.contracted
                                                        ? served
                                                            ? 'Shapes this game'
                                                            : 'Built into the engine'
                                                        : 'Selected, not yet built'}
                                                </Mark>
                                                {constraint.fromGoalCandidates === false && (
                                                    <span className='ml-2'>
                                                        <Mark positive={false}>Not one of this goal&apos;s candidates</Mark>
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                        {alsoWithoutContract.map((entry) => (
                                            <li key={entry}>
                                                <span className='mr-2'>{entry}</span>
                                                <Mark positive={false}>Selected, not yet built</Mark>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    'None selected'
                                )}
                            </AccountField>
                        )}

                        {served?.session && (
                            <AccountField label='Session it was built for'>
                                {served.session.players} players · {served.session.lengthM} m long by {served.session.widthM} m wide ·{' '}
                                {served.session.durationMin} minutes
                                {Object.entries(served.session.roles ?? {}).map(([role, count]) => (
                                    <span key={role}>
                                        {' '}
                                        · {role}s available: {count}
                                    </span>
                                ))}
                            </AccountField>
                        )}

                        {integrity && (
                            <AccountField label='Checks it passed before being shown'>
                                <ul className='space-y-1'>
                                    {integrity.gateA !== undefined && <li>Gate A: {String(integrity.gateA)}</li>}
                                    {integrity.realizationAuthorized !== undefined && (
                                        <li>Realization authorized: {yesNo(integrity.realizationAuthorized)}</li>
                                    )}
                                    {integrity.acceptance &&
                                        Object.entries(integrity.acceptance).map(([name, entries]) => (
                                            <li key={name}>
                                                Acceptance — {name}: {Array.isArray(entries) ? `${entries.length} finding(s)` : String(entries)}
                                            </li>
                                        ))}
                                    {integrity.postRealizationValidated !== undefined && (
                                        <li>Post-realization gates validated: {yesNo(integrity.postRealizationValidated)}</li>
                                    )}
                                    {integrity.instructions !== undefined && <li>Instructions: {String(integrity.instructions)}</li>}
                                    {integrity.fidelityViolations !== undefined && (
                                        <li>Fidelity violations: {String(integrity.fidelityViolations)}</li>
                                    )}
                                    {/* A check the server adds later is shown as sent rather than dropped. */}
                                    {Object.entries(integrity)
                                        .filter(([name]) => !knownIntegrityKeys.includes(name))
                                        .map(([name, value]) => (
                                            <li key={name} className='break-words'>
                                                {name}: <span className='font-mono text-xs'>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                            </li>
                                        ))}
                                </ul>
                            </AccountField>
                        )}

                        {served && (
                            <AccountField label='Each instruction, its status and where it came from'>
                                <ol className='space-y-2'>
                                    {served.rendered.instructions.map((instruction, index) => (
                                        <li key={index} className='px-3 py-2 border border-gray-100 rounded-lg bg-gray-50'>
                                            <p className='text-[11px] font-semibold tracking-wide text-gray-500 uppercase'>
                                                {instruction.section} · {instruction.status}
                                                {STATUS_MEANING[instruction.status] && (
                                                    <span className='font-normal normal-case'> — {STATUS_MEANING[instruction.status]}</span>
                                                )}
                                            </p>
                                            <p className='mt-1 text-sm text-gray-800'>{instruction.text}</p>
                                            {(instruction.from ?? []).length > 0 ? (
                                                <ul className='mt-1'>
                                                    {instruction.from.map((path, pathIndex) => (
                                                        <li key={pathIndex} className='font-mono text-[11px] leading-snug text-gray-500 break-all'>
                                                            {path}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className='mt-1 text-[11px] font-semibold text-amber-600'>No source path was given for this sentence.</p>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            </AccountField>
                        )}

                        {served && (
                            <AccountField label='Observations about this game'>
                                {observations.length > 0 ? (
                                    <ul className='space-y-1'>
                                        {observations.map((observation, index) => (
                                            <li key={index} className='text-sm break-words text-gray-700'>
                                                {asSentence(observation)}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    'None were reported.'
                                )}
                            </AccountField>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}
