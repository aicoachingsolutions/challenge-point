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
 *   * THE OVERVIEW COMES FIRST (stage 4, 22 October 2026). Christian, reply filed 23 October 2026, item 7.4:
 *     "Present the overview first, with complete details accessible when needed." Where the server serves a
 *     Coach Overview, the activity reads: title, Learning purpose, The game, the parameters line, the field
 *     diagram where the server serves one (stage 5B, FieldDiagram.tsx; above the Coach Details where the
 *     overview is withheld), How each team scores (each team's group under its heading, its line first,
 *     then its own qualifications, as served), then "Coach details" — one region, closed until opened, in section order, with no collapse
 *     inside it. A "full rule" link opens it and goes to the Details sentence its pointer names by section and
 *     words. Where the server withholds the overview, the activity is the Coach Details alone. Statuses are
 *     for an administrator only, never for a coach.
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
    ReviewDraft,
    ReviewDraftInstruction,
    ReviewEvidence,
    ReviewFact,
    ReviewSessionQuestion,
    StatedObjects,
} from '@/MODELS/activity-review.model'
import { ISession } from '@/MODELS/session.model'

import { api } from '@/services/api.service'
import { useResource } from '@/services/resource.service'

import Button from '@/components/Button'
import Loading from '@/components/Loading'

// The activity itself, as a coach reads it (moved to its own module on 22 October 2026 so the live app renders it through the same component).
import { ActivityBlock, blockNumberLabel, DemonstrationLabel, groupBySection } from './CheckedActivityBlock'
import { DURATION_OPTIONS } from './SessionPlanningConversation'

/**
 * What each instruction status means, for the account. Wording follows the renderer's own definitions.
 * A status this map does not know is shown as the server sent it, never hidden.
 */
const STATUS_MEANING: Record<string, string> = {
    DERIVED: 'required by the game',
    // 14 October 2026: three statuses replaced REALIZATION_CHOICE (Step 4, component 2, rendered).
    STARTING: 'where this activity starts — can be adjusted',
    ADVISORY: 'recommended, not required',
    COACH_CHOICE: 'left to you to decide',
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


export default function ActivityReviewPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [session, , sessionResource] = useResource<ISession>(`${ROUTES.app.session}/${id}`)
    const [options, , optionsResource] = useResource<ActivityReviewOptions>(ROUTES.app.checkedActivity)

    const [duration, setDuration] = useState<number | null>(null)
    /** Role name -> stated availability. `undefined` is "not stated" and is never sent as a number. */
    const [availability, setAvailability] = useState<Record<string, number | undefined>>({})
    const [choice, setChoice] = useState<ReviewChoice | null>(null)
    /**
     * The coach's answer to a build's question about the session's objects, FOR THIS REVIEW (stage E, 23 October 2026): kind -> what they
     * said. Nothing is asked up front - the server asks only when the activity it would build needs an object of a kind the session has
     * not stated - and nothing is sent until the coach answers. The session is not changed.
     */
    const [objectAnswers, setObjectAnswers] = useState<Record<string, StatedObjects>>({})
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

    const build = async (answers: Record<string, StatedObjects> = objectAnswers) => {
        if (!choice || duration === null || unstatedRoles.length > 0) return
        invalidate()
        const askedAt = asked.current

        const request: ActivityReviewRequest = {
            ...(choice.kind === 'learning-goal' ? { learningGoalId: choice.id } : { demonstrationId: choice.id }),
            durationMin: duration,
            roles: Object.fromEntries(roleNames.map((role) => [role, availability[role] as number])),
            // Stage E: only what the coach answered on this page, never a guess.
            ...(Object.keys(answers).length > 0 ? { objects: answers } : {}),
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
            <div className='flex flex-col w-full max-w-4xl gap-4 px-4 py-6 mx-auto sm:py-8 sm:px-6'>
                <div className='p-4 border border-red-200 rounded-lg sm:p-6 bg-red-50'>
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
        // Mobile first (stage 4): a 16 px gutter at phone width, and nothing wider than the screen.
        <div className='flex flex-col w-full max-w-4xl min-w-0 gap-6 px-4 py-6 mx-auto sm:py-8 sm:px-6'>
            <header>
                <h1 className='pb-2 mb-2 text-xl font-semibold text-gray-800 border-b border-gray-200'>Activity review</h1>
                <p className='text-sm text-gray-600'>
                    The activity a coach would receive for a Learning Goal, built from this session: {session.name || 'Session'}.
                </p>
            </header>

            {/* 1. The session, as the coach entered it. */}
            <section className='bg-white border rounded-lg shadow-sm'>
                <div className='p-4 sm:p-6'>
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
                <div className='p-4 sm:p-6'>
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
                <Button onClickAsync={() => build()} disabled={!canBuild} className='w-full max-w-sm rounded-full sm:self-center'>
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
                    <div role='alert' className='p-4 border border-red-200 rounded-lg sm:p-6 bg-red-50'>
                        <p className='font-medium text-red-800'>The activity could not be requested, so nothing is shown.</p>
                        <p className='mt-1 text-sm text-red-800'>{requestError}</p>
                    </div>
                )}

                {/* Which pathway built it, and whether the live app serves it (stage K7, his 18 October item 7). */}
                {result && <PathwayNote result={result} />}
                {/*
                  * Which of the goal's alternative versions was built, and why the others were not, is in the closed account panel below
                  * (RealizationVersions), never here: it quotes his citations and the record's gap descriptions, and his 13 October rule
                  * keeps the activity primary and everything technical secondary (Stage G review fix, 23 October 2026).
                  */}

                {/* 3 and 4. The answer, primary: the activity, or the sentence saying why there is none. */}
                {result?.outcome === 'served' && <ActivityBlock activity={result} />}
                {result?.outcome === 'refused' && <RefusalBlock refusal={result} />}
                {/* Stage E: the build's question, where it stopped to ask one, answered for this review only. */}
                {result?.outcome === 'refused' && result.question && (
                    <ObjectQuestionBlock
                        question={result.question}
                        stored={session.objects?.[result.question.objectKind]}
                        answered={objectAnswers[result.question.objectKind]}
                        onAnswer={async (answer) => {
                            const answers = { ...objectAnswers, [result.question!.objectKind]: answer }
                            setObjectAnswers(answers)
                            await build(answers)
                        }}
                    />
                )}
                {result?.outcome === 'refused' && result.draft && <DraftBlock refusal={result} draft={result.draft} />}
                {result?.evidence && <ReviewEvidencePanel evidence={result.evidence} />}

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

/** A ruling's date as a coach reads it: "2026-10-14" is "14 October". Anything else is shown as sent. */
function rulingDate(isoDate: string): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const [year, month, day] = String(isoDate).split('-').map(Number)
    if (!year || !month || !day || month > 12) return String(isoDate)
    return `${day} ${months[month - 1]}`
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

/**
 * **The build's question about the session's objects, answered for this review only** — stage E, 23 October 2026 (wording DRAFT).
 *
 * Christian, reply filed 25 October 2026, item 4: goal availability is its own session resource, never inferred from the goalkeepers, and
 * (the note sent to him) asked only when the activity it would build needs one. So nothing about objects is asked above: this appears only
 * when the server stopped to ask (`question`), with the server's own sentence, and the kind is the server's (no kind is named in this file).
 * Blank means not answered: nothing is sent until the coach gives a whole number (and, where there is at least one, a width in metres
 * above zero). The session itself is not changed.
 */
function ObjectQuestionBlock({
    question,
    stored,
    answered,
    onAnswer,
}: {
    question: ReviewSessionQuestion
    stored?: StatedObjects
    answered?: StatedObjects
    onAnswer: (answer: StatedObjects) => Promise<void>
}) {
    const start = answered ?? stored
    const [count, setCount] = useState<number | undefined>(isStatedCount(start?.count) ? start!.count : undefined)
    const [width, setWidth] = useState<number | undefined>(typeof start?.widthM === 'number' ? start.widthM : undefined)
    const asksCount = question.asks !== 'WIDTH'
    const countGiven = isStatedCount(count)
    const widthGiven = typeof width === 'number' && Number.isFinite(width) && width > 0
    const ready = countGiven && (count === 0 || widthGiven)
    const kind = question.objectKind
    return (
        <article className='p-6 bg-white border rounded-lg border-amber-200'>
            <p className='font-medium text-gray-800'>{question.words}</p>
            <div className='grid grid-cols-1 gap-4 mt-4 md:grid-cols-2'>
                {asksCount && (
                    <NumberField
                        label={`How many ${kind}s can you use today?`}
                        value={count}
                        onChange={(value) => setCount(isStatedCount(value) ? value : undefined)}
                        min={0}
                        step={1}
                        placeholder='Enter a number — 0 if none'
                        labelClass='text-gray-700 font-medium mb-2 block'
                        inputClass='text-base'
                        className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                    />
                )}
                <NumberField
                    label={`How wide are they, in metres?`}
                    value={width}
                    onChange={(value) => setWidth(typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined)}
                    disabled={countGiven && count === 0}
                    min={0}
                    step={0.1}
                    placeholder='e.g. post to post'
                    labelClass='text-gray-700 font-medium mb-2 block'
                    inputClass='text-base'
                    className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                />
            </div>
            <p className='mt-2 text-sm text-gray-500'>For this review only — your session is not changed.</p>
            <Button
                onClickAsync={() => onAnswer({ count: count as number, ...(count !== 0 && widthGiven ? { widthM: width } : {}) })}
                disabled={!ready}
                className='mt-4 rounded-full'
            >
                Build the activity with this answer
            </Button>
        </article>
    )
}

/**
 * **Which pathway built this, and whether the live app serves it — stage K7, 15 October 2026 (wording DRAFT).** Christian, reply filed
 * 18 October 2026, item 7: "Similarly, I understand that the checked review pathway is not yet the live application pathway because
 * of the outstanding constraint requirement. Please keep that distinction visible as we approach acceptance."
 *
 * Every result on this page comes through the checked review pathway, so that is said for every result.
 *
 * **Restated 22 October 2026 (the live-app fix; his reply filed 25 October 2026, item 8).** Until then, where a Learning Goal's selection held
 * no library constraint, the live app refused it before any activity was made, and this note said so with his 18 October words. The live
 * app now builds a goal whose selection draws its constraints from its authorization record through this same checked pathway, with no
 * library constraint added, so for such a goal the note says that the live app shows this activity too; for every other goal it says, as
 * before, that the live app does not build it this way. Read from the account the server sent (whose authority the selected constraints
 * carry, the datum the live route decides by); no goal is named here. Wording DRAFT.
 */
function PathwayNote({ result }: { result: ActivityReviewResult }) {
    const recordBacked = result.kind === 'learning-goal' && result.account?.constraintSource?.constraintAuthority === 'AUTHORIZATION_RECORD'
    return (
        <div role='note' className='p-4 text-sm border rounded-lg text-slate-700 bg-slate-50 border-slate-200'>
            {recordBacked ? (
                <>
                    <p className='font-medium'>Built through the checked review pathway, which the live app now uses for this goal too.</p>
                    <p className='mt-1'>
                        The live app builds this goal&apos;s activity through this same checked pathway, from the coach&apos;s session, with no library
                        constraint added, so a coach sees there what this page shows for the same session.
                    </p>
                </>
            ) : (
                <p className='font-medium'>Built through the checked review pathway, not the live app.</p>
            )}
        </div>
    )
}

/**
 * **Which version of the activity was built, and why the others were not — Stage G, 23 October 2026 (wording DRAFT).** Christian, reply
 * filed 25 October 2026, item 4: "These should be alternative knowledge-authorized realizations, not separate hardcoded implementations of
 * the same Learning Goal."; his reply filed 26 October 2026, item 11: "Automatic selection between appropriately authorized goal and zone
 * versions is acceptable for this first implementation." The note sent to him said the review "shows which version was used and why". Shown
 * only where the goal's record authorizes more than one version, read from the server's own account (`realizationSelection`, each entry
 * with his words for its place in the order, its outcome and why) and the record's own gap descriptions (`authorization.gaps`): the built
 * version in his words, then each other version and why it was not built. Nothing here chooses or names a version: every word of a
 * version is his, every reason the server's.
 *
 * **Where it is shown — the Stage G review fix, 23 October 2026.** It was first a note above the activity, for every reader. It quotes his
 * citations and the record's internal gap descriptions, so it broke his 13 October rule this page is built on ("Please keep the actual
 * coach-facing activity primary, with its selection rationale and technical evidence available separately.") and the page's own contract
 * that everything technical stays in one panel closed until the reader opens it; it also changed what a coach saw above the zone version
 * where no snapshot could see it. It is now one field of that closed panel (`ArrivedAt`), beside the technical list of the same entries,
 * and nothing about versions is said above the activity.
 */
function RealizationVersions({ result }: { result: ActivityReviewResult }) {
    const entries = result.account?.realizationSelection ?? []
    if (entries.length < 2) return null
    const gapWords = (id: string) => result.account?.authorization?.gaps?.find((gap) => gap.id === id)?.description ?? id
    const quoted = (entry: (typeof entries)[number]) => (entry.words ? <>&ldquo;{entry.words}&rdquo;{entry.citedAs ? ` (${entry.citedAs})` : ''}</> : <span className='font-mono text-xs'>{entry.realization}</span>)
    const why = (entry: (typeof entries)[number]): string => {
        if (entry.outcome === 'NOT_SELECTABLE') return `not built: it waits on decisions that are still open: ${entry.gaps.map(gapWords).join(' ')}`
        if (entry.outcome === 'NOT_TRIED') return 'not needed: a version earlier in the order was built'
        if (entry.outcome === 'NOT_APPLICABLE') return `not built: it does not apply to this session${entry.summary ? ` (${entry.summary})` : ''}`
        if (entry.outcome === 'ASKED') return `not built yet: the session must say something first${entry.summary ? ` (${entry.summary})` : ''}`
        if (entry.outcome === 'REFUSED') return `not built${entry.summary ? `: ${entry.summary}` : ''}`
        return entry.outcome
    }
    const built = entries.find((entry) => entry.outcome === 'SELECTED')
    return (
        <AccountField label='Which version was built, and why'>
            <p className='font-medium'>{built ? 'Version built' : 'No version of this activity was built'}</p>
            {built && <p className='mt-1'>{quoted(built)}</p>}
            <ul className='mt-2 space-y-1'>
                {entries
                    .filter((entry) => entry !== built)
                    .map((entry) => (
                        <li key={entry.realization}>
                            {quoted(entry)}: {why(entry)}
                        </li>
                    ))}
            </ul>
        </AccountField>
    )
}

/**
 * **The draft activity, for an administrator only — stage K7, 15 October 2026 (labels DRAFT).** The server attaches it to a refusal at
 * communication only when the request came from an administrator; a coach never receives it. It shows the sentences the server could
 * say, in the same sections as an activity, each DRAFT one badged; what has no approved wording yet; and the fidelity verdict on the
 * draft. It is not an activity a coach can be given, and the banner says so before anything else.
 */
function DraftBlock({ refusal, draft }: { refusal: RefusedActivity; draft: ReviewDraft }) {
    const grouped = groupBySection(draft.instructions)
    const blockIds = [...new Set(draft.instructions.map((instruction) => instruction.block).filter((id): id is string => !!id))]
    const rows = [...new Set(draft.withheld.map((field) => field.row))]
    return (
        <article className='bg-white border-2 border-dashed rounded-lg border-violet-300'>
            <div role='note' className='px-6 py-3 text-sm font-medium border-b rounded-t-lg text-violet-900 bg-violet-50 border-violet-200'>
                Draft coach instructions for {refusal.title}, awaiting approval. Not shown to coaches.
            </div>
            <div className='p-6 space-y-5'>
                {grouped.map((group) => (
                    <div key={group.section}>
                        <p className='mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase'>{group.section}</p>
                        <ul className='space-y-1'>
                            {group.lines.map((line, index) => {
                                const instruction = line as ReviewDraftInstruction
                                const block = instruction.block ? blockIds.indexOf(instruction.block) + 1 : 0
                                return (
                                    <li key={index} className='flex items-start gap-2 text-sm text-gray-700'>
                                        <span aria-hidden className='text-gray-400'>
                                            &bull;
                                        </span>
                                        <span className='leading-relaxed'>
                                            {block > 0 && `Block ${block} only: `}
                                            {instruction.text}
                                            {instruction.wording === 'DRAFT' && (
                                                <span className='ml-2 inline-block px-1.5 py-0.5 text-[10px] font-semibold text-violet-800 bg-violet-100 rounded'>Draft wording</span>
                                            )}
                                            {instruction.provisionalSources?.length > 0 && (
                                                <span className='block text-xs text-gray-400'>Provisional choices: {instruction.provisionalSources.join(', ')}</span>
                                            )}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ))}
                {draft.withheld.length > 0 && (
                    <div className='pt-4 border-t border-gray-200'>
                        <p className='text-sm font-medium text-gray-700'>
                            No approved wording yet for {draft.withheld.length} field{draft.withheld.length === 1 ? '' : 's'} (register rows {rows.join(', ')}), so the activity is
                            not shown to coaches:
                        </p>
                        <ul className='mt-1 space-y-0.5 text-xs text-gray-500 break-all'>
                            {draft.withheld.map((field, index) => (
                                <li key={index}>
                                    {field.row}: {field.path}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <p className='text-sm text-gray-600'>
                    Fidelity on this draft: {draft.fidelity.passed ? 'nothing lost, invented or changed in status' : `${draft.fidelity.violations.length} finding(s)`}.
                </p>
                {!draft.fidelity.passed && (
                    <ul className='space-y-0.5 text-xs text-gray-500 break-all'>
                        {draft.fidelity.violations.map((violation, index) => (
                            <li key={index}>{violation}</li>
                        ))}
                    </ul>
                )}
            </div>
        </article>
    )
}

/** A fact as the server sent it: what it is, and its value printed plainly (a list or an object as compact JSON). */
function FactLine({ fact }: { fact: ReviewFact }) {
    const value = typeof fact.value === 'string' || typeof fact.value === 'number' || typeof fact.value === 'boolean' ? String(fact.value) : JSON.stringify(fact.value)
    return (
        <li className='text-xs text-gray-600 [overflow-wrap:anywhere]'>
            <span className='text-gray-800'>{fact.what}</span>: <span className='font-mono'>{value}</span>
        </li>
    )
}

function Facts({ facts }: { facts: ReviewFact[] }) {
    return (
        <ul className='space-y-0.5'>
            {facts.map((fact, index) => (
                <FactLine key={index} fact={fact} />
            ))}
        </ul>
    )
}

/** A quotation of Christian's, with where he said it. */
function His({ words, citedAs }: { words: string; citedAs: string }) {
    return (
        <p className='text-xs text-gray-700'>
            &ldquo;{words}&rdquo; <span className='text-gray-400'>({citedAs})</span>
        </p>
    )
}

/** One collapsible part of the evidence. Closed until opened: the activity stays primary. */
function EvidencePart({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    return (
        <div className='border-t border-gray-200'>
            <button type='button' className='flex items-center justify-between w-full gap-2 py-2 text-sm font-medium text-left text-gray-700' aria-expanded={open} onClick={() => setOpen(!open)}>
                {title}
                {open ? <ChevronUpIcon className='w-4 h-4 shrink-0' /> : <ChevronDownIcon className='w-4 h-4 shrink-0' />}
            </button>
            {open && <div className='pb-3 space-y-3'>{children}</div>}
        </div>
    )
}

/**
 * **The review evidence, for an administrator only — stage K8, 15 October 2026 (labels DRAFT).** The server attaches it only to an
 * administrator's review of a goal whose record carries Christian's review request. Technical and secondary: the activity (or its draft)
 * stays primary above. Everything is shown as the server sent it — facts read from the generated game, the gates' own verdicts, his
 * words from the record — and nothing here claims how the activity plays; that judgement is his, and the panel says so in his words.
 */
function ReviewEvidencePanel({ evidence }: { evidence: ReviewEvidence }) {
    const blockLabel = (blockId: string) => {
        const at = evidence.measured.blocks.findIndex((block) => block.blockId === blockId)
        return at >= 0 ? `Block ${at + 1}` : blockId
    }
    // Stage 4: ids, paths and JSON here are long unbroken runs; every line may break anywhere, so a phone shows the panel without
    // horizontal scrolling (overflow-wrap is inherited by everything inside).
    return (
        <section className='bg-white border rounded-lg shadow-sm [overflow-wrap:anywhere]'>
            <div className='px-4 pt-4 sm:px-6'>
                <p className='text-sm font-medium text-gray-800'>Review evidence (technical, administrators only)</p>
                <p className='mt-1 text-xs text-gray-500'>{evidence.about}</p>
            </div>
            <div className='px-4 pb-4 mt-3 sm:px-6'>
                <EvidencePart title='Acceptance and the checked pathway'>
                    <Facts facts={evidence.acceptance} />
                    <Facts facts={evidence.pathway.facts} />
                    <His {...evidence.pathway.his} />
                </EvidencePart>
                <EvidencePart title='The nine items you asked for'>
                    {evidence.items.map((item) => (
                        <div key={item.id} className='text-xs text-gray-600'>
                            <His words={item.words} citedAs={item.citedAs} />
                            <p className='mt-0.5'>
                                {item.resolved ? 'Resolved' : 'NOT RESOLVED'} · elements per block {item.blocks.map((block) => block.elements.length).join(' / ')} · sentences{' '}
                                {item.sentences.map((index) => index + 1).join(', ') || 'none'} · checks {item.checks.map((check) => `${check.checkId}${check.blockId ? ` (${blockLabel(check.blockId)})` : ''} ${check.verdict}`).join(', ') || 'none'}
                                {item.awaiting.length > 0 && ` · ${item.awaiting.length} field(s) awaiting approved wording`}
                            </p>
                            {(item.facts ?? [])
                                .filter((block) => block.facts.length > 0)
                                .map((block) => (
                                    <div key={block.blockId} className='pl-3'>
                                        <p className='text-xs text-gray-500'>{blockLabel(block.blockId)}</p>
                                        <Facts facts={block.facts} />
                                    </div>
                                ))}
                        </div>
                    ))}
                </EvidencePart>
                <EvidencePart title='Structural consistency'>
                    <p className='text-xs text-gray-600'>
                        Every check passes: {evidence.structure.summary.everyCheckPasses ? 'yes' : 'NO'} · Gate A per block {JSON.stringify(evidence.structure.summary.gateChecks)} · owed {JSON.stringify(evidence.structure.summary.owed)} · cross-block{' '}
                        {JSON.stringify(evidence.structure.summary.crossBlock)} · vacuous passes named: {evidence.structure.summary.vacuousClauses.length}
                    </p>
                    {evidence.structure.blocks.map((block) => (
                        <div key={block.blockId} className='space-y-1'>
                            <p className='text-xs font-semibold text-gray-700'>
                                {blockLabel(block.blockId)}: {Object.entries(block.holders).map(([role, team]) => `${role} = ${team}`).join(', ')}
                                {block.ends && ` · ends: ${Object.entries(block.ends).map(([end, from]) => `${end} held by the team at ${from} in the first block`).join(', ')}`}
                            </p>
                            {Object.entries(block.sections).map(([name, section]) => (
                                <div key={name} className='pl-3'>
                                    <p className='text-xs text-gray-500'>
                                        {name}: {section.checks.map((check) => `${check.checkId} ${check.verdict}`).join(', ') || 'no check'}
                                    </p>
                                    <Facts facts={section.facts} />
                                </div>
                            ))}
                        </div>
                    ))}
                    <ul className='space-y-0.5'>
                        {evidence.structure.crossBlock.map((check) => (
                            <li key={check.checkId} className='text-xs text-gray-600'>
                                {check.checkId} {check.verdict}: {check.what}
                            </li>
                        ))}
                    </ul>
                </EvidencePart>
                <EvidencePart title='The specialized player as a supporting option'>
                    {evidence.sections.specializedRoles.map((role) => (
                        <div key={role.role}>
                            <p className='text-xs font-semibold text-gray-700'>
                                {role.role} (available in the session: {String(role.available)})
                            </p>
                            <Facts facts={role.facts} />
                        </div>
                    ))}
                </EvidencePart>
                <EvidencePart title='Pressure, scoring and restarts'>
                    <Facts facts={evidence.sections.allocation} />
                    <Facts facts={evidence.sections.pressure} />
                    <Facts facts={evidence.sections.scoring} />
                    <Facts facts={evidence.sections.restarts.map((row) => ({ what: `${blockLabel(String(row.blockId))}: ${String(row.elementId)}`, value: { ...row, blockId: undefined, elementId: undefined } }))} />
                    <Facts facts={evidence.sections.roleExchange} />
                </EvidencePart>
                <EvidencePart title='No prescribed patterns or behaviours'>
                    <Facts facts={evidence.sections.noPrescription} />
                </EvidencePart>
                <EvidencePart title='Flagged for your review'>
                    {evidence.flags.map((flag) => (
                        <div key={flag.id} className='space-y-1'>
                            <p className='text-xs font-semibold text-gray-700'>
                                {flag.kind} — {flag.status}
                            </p>
                            {flag.his.map((said, index) => (
                                <His key={index} {...said} />
                            ))}
                            {(flag.settledBy ?? []).length > 0 && <p className='text-xs text-gray-500'>Your ruling on it:</p>}
                            {(flag.settledBy ?? []).map((said, index) => (
                                <His key={`settled-${index}`} {...said} />
                            ))}
                            <p className='text-xs text-gray-800'>{flag.answer}</p>
                            {flag.blocks.map((block) => (
                                <div key={block.blockId} className='pl-3'>
                                    <p className='text-xs text-gray-500'>{blockLabel(block.blockId)}</p>
                                    <Facts facts={block.facts} />
                                </div>
                            ))}
                            {flag.knowledge && (
                                <div className='pl-3'>
                                    <p className='text-xs text-gray-500'>Existing knowledge that could carry such a relationship (read only; nothing selected or built)</p>
                                    <Facts facts={[...flag.knowledge.libraryEntries, ...flag.knowledge.corpusItems, ...flag.knowledge.registerRows]} />
                                </div>
                            )}
                        </div>
                    ))}
                </EvidencePart>
                <EvidencePart title='Limitations kept visible'>
                    {(evidence.limitations ?? []).map((limitation) => (
                        <div key={limitation.id} className='space-y-1'>
                            <p className='text-xs font-semibold text-gray-700'>
                                {limitation.id} — {limitation.kind}
                            </p>
                            {limitation.his.map((said, index) => (
                                <His key={index} {...said} />
                            ))}
                            <div className='pl-3'>
                                <Facts facts={limitation.facts} />
                            </div>
                        </div>
                    ))}
                </EvidencePart>
                {/*
                  * H2 (23 October 2026): the default-laws account as the server computed it, shown as sent - the strictness the realization
                  * declares, his words for the principle, each law per block and place with its status and why, the items that depart from it
                  * (with his words), and the DRAFT sentence held for the coach (never served). Labels are DRAFTS.
                  */}
                {evidence.defaultLaws && (
                    <EvidencePart title='Normal rules: default and adaptations'>
                        <p className='text-xs text-gray-600 [overflow-wrap:anywhere]'>
                            {evidence.defaultLaws.realization}: {evidence.defaultLaws.mode} · {evidence.defaultLaws.source.source} (edition {evidence.defaultLaws.source.edition ?? 'not named'}) · {evidence.defaultLaws.owed.length} adaptation
                            {evidence.defaultLaws.owed.length === 1 ? '' : 's'} owed
                        </p>
                        <p className='text-xs text-gray-600'>{evidence.defaultLaws.check.because}</p>
                        {evidence.defaultLaws.source.authority.words.map((words, index) => (
                            <His key={index} words={words} citedAs={evidence.defaultLaws!.source.authority.citedAs} />
                        ))}
                        {evidence.defaultLaws.heldSentence && (
                            <p className='text-xs text-gray-500'>
                                Held, not served (DRAFT): &ldquo;{evidence.defaultLaws.heldSentence.text}&rdquo;
                            </p>
                        )}
                        {evidence.defaultLaws.blocks.map((block) => (
                            <div key={block.blockId} className='space-y-1'>
                                <p className='text-xs text-gray-500'>{blockLabel(block.blockId)}</p>
                                <ul className='space-y-0.5'>
                                    {block.laws.map((law, index) => (
                                        <li key={index} className='text-xs text-gray-600 [overflow-wrap:anywhere]'>
                                            <span className='text-gray-800'>
                                                {law.law} ({law.cites}) at {law.at}: {law.status}
                                            </span>{' '}
                                            — {law.why}
                                            {/* H3: the profile's note on the law, so an owed adaptation says which decision settles it. */}
                                            {law.note && <span className='block text-gray-500'>Note: {law.note}</span>}
                                            {[...law.departedBy, ...law.departedInPart, ...law.noLongerHolds, ...law.recordedBy].map((departure, at) => (
                                                <His key={at} words={departure.basis.words.join(' ')} citedAs={`${departure.item}, ${departure.extent}${departure.part ? ` (${departure.part})` : ''}; ${departure.basis.citedAs}`} />
                                            ))}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </EvidencePart>
                )}
                {/*
                  * H3 (23 October 2026): the regions bound to the games' objects, shown as sent - each region, the object it is bound to and
                  * who defends it, where it lies, and the authorized pairing it cites whole: its document and citation, its format conditions
                  * (shown, never matched), the object's type and size, the region's size, its mark, what it borrows, and his words. Present only
                  * where a game holds one (no production activity does). Labels are DRAFTS.
                  */}
                {evidence.boundRegions && (
                    <EvidencePart title='Regions bound to objects'>
                        {evidence.boundRegions.source.authority.words.map((words, index) => (
                            <His key={index} words={words} citedAs={evidence.boundRegions!.source.authority.citedAs} />
                        ))}
                        {evidence.boundRegions.requirements.map((requirement) => (
                            <p key={requirement.id} className='text-xs text-gray-600 [overflow-wrap:anywhere]'>
                                {requirement.id}: a {requirement.object.kind}
                                {requirement.object.whenDefended ? ' that is defended' : ''} needs one {requirement.region.noun} of the function {requirement.region.function} bound to it ({requirement.cites})
                            </p>
                        ))}
                        {evidence.boundRegions.blocks.map((block) => (
                            <div key={block.blockId} className='space-y-1'>
                                <p className='text-xs text-gray-500'>{blockLabel(block.blockId)}</p>
                                <ul className='space-y-1'>
                                    {block.bindings.map((binding, index) => (
                                        <li key={index} className='text-xs text-gray-600 [overflow-wrap:anywhere]'>
                                            <span className='text-gray-800'>
                                                {binding.region} ({binding.noun ?? 'no noun'}; {binding.functions.join(', ')}) bound to {binding.object}
                                                {binding.kind ? ` (${binding.kind})` : ''}
                                                {binding.defendedBy ? `, defended by the team holding ${binding.defendedBy}` : ''}
                                            </span>
                                            {binding.along && binding.across && (
                                                <span className='block'>
                                                    Lies {binding.along.from}-{binding.along.to} m along and {binding.across.from}-{binding.across.to} m across the area
                                                </span>
                                            )}
                                            {binding.pairing ? (
                                                <span className='block'>
                                                    Pairing {binding.pairing.id}: {binding.pairing.document}
                                                    {binding.pairing.edition ? ` (${binding.pairing.edition})` : ' (edition not named)'}, {binding.pairing.citedAs}; {binding.pairing.object.type} {binding.pairing.object.kind}{' '}
                                                    {binding.pairing.object.widthM} m wide{binding.pairing.object.heightM !== null ? ` and ${binding.pairing.object.heightM} m high` : ''}; region {binding.pairing.region.widthM} m wide and{' '}
                                                    {binding.pairing.region.depthM} m deep; mark {binding.pairing.markM !== null ? `at ${binding.pairing.markM} m` : 'none'}; borrows {binding.pairing.borrows.join(', ')}; format: players{' '}
                                                    {binding.pairing.formatConditions.players ?? 'not stated'}, age band {binding.pairing.formatConditions.ageBand ?? 'not stated'}, pitch {binding.pairing.formatConditions.pitch ?? 'not stated'}
                                                    {binding.pairing.authority.words.map((words, at) => (
                                                        <His key={at} words={words} citedAs={binding.pairing!.authority.citedAs} />
                                                    ))}
                                                </span>
                                            ) : (
                                                <span className='block'>It cites no pairing the Sport Profile holds.</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </EvidencePart>
                )}
                {/*
                  * Stage 4: the Coach Overview's agreement check as the server ran it (stage 3D-3F), shown as sent: served or withheld, the
                  * verdict and every finding, the table and readings record it rests on (C1: each with which of its rules or readings he
                  * approved and which remain PROPOSED, as the server names them), the reading evidence (never a gate), and each team's material
                  * elements with the overview sentence(s) stating each. Labels are DRAFTS.
                  */}
                {evidence.overview && (
                    <EvidencePart title='The Coach Overview: agreement check and what it states'>
                        <p className='text-xs text-gray-600 [overflow-wrap:anywhere]'>
                            Served: {evidence.overview.served ? 'yes' : 'no (withheld; Coach details served on their own)'} · verdict {evidence.overview.verdict} · essentials table{' '}
                            {evidence.overview.table.status} ({evidence.overview.table.source}) · readings {evidence.overview.readings?.status ?? 'none'} (
                            {evidence.overview.readings?.source ?? 'none'})
                        </p>
                        {(evidence.overview.table.approved?.length ?? 0) > 0 && (
                            <p className='text-xs text-gray-600 [overflow-wrap:anywhere]'>
                                Essentials rules approved: {evidence.overview.table.approved!.join(', ')}; still PROPOSED:{' '}
                                {(evidence.overview.table.proposed ?? []).join(', ') || 'none'}.
                            </p>
                        )}
                        {(evidence.overview.readings?.approved?.length ?? 0) > 0 && (
                            <p className='text-xs text-gray-600 [overflow-wrap:anywhere]'>
                                Readings approved: {evidence.overview.readings!.approved!.join('; ')}; still PROPOSED: {(evidence.overview.readings!.proposed ?? []).join('; ') || 'none'}.
                            </p>
                        )}
                        {evidence.overview.reading && (
                            <p className='text-xs text-gray-600'>
                                Reading evidence, never a gate: {evidence.overview.reading.words} words, about {evidence.overview.reading.secondsAt250Wpm}-
                                {evidence.overview.reading.secondsAt200Wpm} s at 250-200 words a minute; Coach details {evidence.overview.reading.detailsWords} words.
                            </p>
                        )}
                        <ul className='space-y-0.5'>
                            {evidence.overview.findings.map((finding, index) => (
                                <li key={index} className='text-xs text-gray-600 [overflow-wrap:anywhere]'>
                                    [{finding.severity} Q{finding.question}
                                    {finding.blockId ? ` ${blockLabel(finding.blockId)}` : ''}] {finding.what}
                                </li>
                            ))}
                        </ul>
                        {(evidence.overview.meaning ?? []).map((group) => (
                            <div key={group.group} className='space-y-0.5'>
                                <p className='text-xs font-semibold text-gray-700'>{group.noun ?? group.group}</p>
                                <ul className='space-y-1'>
                                    {group.elements.map((element, index) => (
                                        <li key={index} className='text-xs text-gray-600 [overflow-wrap:anywhere]'>
                                            {element.rule} ({element.class}
                                            {element.material ? ', material' : ''}):{' '}
                                            {element.statedBy.length > 0
                                                ? `stated by ${element.statedBy.map((text) => `"${text}"`).join(' + ')}`
                                                : element.pointer
                                                  ? `left to Coach details: "${element.pointer.text}"`
                                                  : 'not stated'}
                                            {element.notStatedBy.map((cited, at) => (
                                                <span key={at} className='block pl-3 text-gray-500'>
                                                    Cited but not stated by &ldquo;{cited.text}&rdquo;: {cited.why}
                                                </span>
                                            ))}
                                            <span className='block pl-3 text-gray-500'>{element.because}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </EvidencePart>
                )}
                <EvidencePart title='Sentences: wording, layers and provenance'>
                    <p className='text-xs text-gray-500'>Layers: {evidence.layers.map((layer) => `${layer.code} = "${layer.words}"`).join('; ')}; the session is none of them.</p>
                    <ol className='space-y-1 list-decimal list-inside'>
                        {evidence.sections.instructions.map((sentence) => (
                            <li key={sentence.index} className='text-xs text-gray-700'>
                                {sentence.block && `${blockLabel(sentence.block)} only: `}
                                {sentence.text} <span className='text-violet-700'>[{sentence.wording}]</span>
                                {/*
                                  * Stage 4: each source's `detail` (the stage 2C review: the both-blocks geometry shows only there). Its paths
                                  * and the layer codes are long unbroken runs, so the line may break anywhere: at phone width the page must not
                                  * be held wider than the screen.
                                  */}
                                <span className='block pl-4 text-gray-500 break-all'>
                                    {sentence.layers.join(' + ')} · {sentence.standings.join(' + ')} ·{' '}
                                    {sentence.sources.map((source) => `${source.standing} ${source.ref}${source.detail ? ` (${source.detail})` : ''}`).join('; ')}
                                </span>
                            </li>
                        ))}
                    </ol>
                    <Facts facts={evidence.provenance.openForReview} />
                </EvidencePart>
                <EvidencePart title='The points you will evaluate, and your reasons'>
                    <His {...evidence.evaluation.his} />
                    <ul className='space-y-0.5'>
                        {evidence.evaluation.points.map((point) => (
                            <li key={point.id} className='text-xs text-gray-600'>
                                {point.words} <span className='text-gray-400'>(sections {point.sections.join(', ')})</span>
                            </li>
                        ))}
                    </ul>
                    <p className='text-xs text-gray-500'>{evidence.evaluation.judgement}</p>
                    {evidence.rationale.features.map((feature, index) => (
                        <div key={index} className='space-y-0.5'>
                            <p className='text-xs font-semibold text-gray-700'>{feature.feature} (our label)</p>
                            {feature.words.map((said, at) => (
                                <His key={at} {...said} />
                            ))}
                            {feature.statements.map((statement) => (
                                <p key={statement.id} className='text-xs text-gray-500'>
                                    {statement.id}: {statement.text}
                                </p>
                            ))}
                        </div>
                    ))}
                    {evidence.rationale.his.words.map((words, index) => (
                        <His key={index} words={words} citedAs={evidence.rationale.his.citedAs} />
                    ))}
                    <p className='text-xs text-gray-500'>{evidence.rationale.judgement}</p>
                </EvidencePart>
            </div>
        </section>
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

    // Stage 4: as the evidence panel, every line may break anywhere, so the account's ids and paths never widen the page on a phone.
    return (
        <section className='bg-white border rounded-lg shadow-sm [overflow-wrap:anywhere]'>
            <div className='p-4 sm:p-6'>
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
                                                <li key={index} className='font-mono text-xs [overflow-wrap:anywhere] whitespace-pre-wrap text-gray-700'>
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

                        {/* Stage G (moved here by its review fix): which version was built in his words, and why each other was not. */}
                        <RealizationVersions result={result} />

                        {/*
                          * Stage E (23 October 2026), technical account only, DRAFT labels: every realization the goal's record names, in
                          * its order, and whether it was used and why - the server's own entries, shown as sent.
                          */}
                        {Array.isArray(account.realizationSelection) && account.realizationSelection.length > 0 && (
                            <AccountField label='Realizations, in the order the record authorizes them'>
                                <ul className='space-y-1'>
                                    {account.realizationSelection.map((entry) => (
                                        <li key={entry.realization} className='text-sm text-gray-700'>
                                            <span className='font-mono text-xs'>{entry.realization}</span>: {entry.outcome}
                                            {entry.cause ? ` (${entry.cause})` : ''}
                                            {entry.summary ? ` — ${entry.summary}` : ''}
                                            {entry.gaps.length > 0 ? ` — waits on ${entry.gaps.join(', ')}` : ''}
                                        </li>
                                    ))}
                                </ul>
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
                                  * Christian, 14 October: "If no appropriate shaping constraint is available,
                                  * please report that as a knowledge gap … keep those gaps visible rather than
                                  * compensating through fallback selection." Each role no designated candidate
                                  * fills is said before the list, and so is each candidate his ruling holds.
                                  * Wording is a DRAFT.
                                  *
                                  * 15 October 2026, later: where the goal's record evaluated its constraints and found
                                  * none justified, his general principle governs ("A library constraint is not mandatory
                                  * unless its inclusion is justified by the approved knowledge and intended learning
                                  * environment"), so an unfilled role is not a gap and is not shown as one; the
                                  * principle is said instead, read from the account. Wording is a DRAFT.
                                  */}
                                {account.constraintSource?.constraintPrinciple && constraints.length === 0 && (
                                    <p className='mb-1 text-xs text-gray-600'>
                                        No library constraint: none is justified for this goal by the approved knowledge. General principle, ruled{' '}
                                        {rulingDate(account.constraintSource.constraintPrinciple.ruledOn)} by {account.constraintSource.constraintPrinciple.by}: "
                                        {account.constraintSource.constraintPrinciple.principle}"
                                    </p>
                                )}
                                {(account.constraintSource?.constraintPrinciple && constraints.length === 0 ? [] : account.constraintSource?.unfilledRoles ?? []).map((role) => (
                                    <p key={role} className='mb-1 text-xs text-amber-700'>
                                        No designated {role} constraint — a knowledge gap, reported rather than filled
                                    </p>
                                ))}
                                {(account.constraintSource?.heldByRuling ?? []).map((hold) => (
                                    <p key={hold.id} className='mb-1 text-xs text-amber-700'>
                                        {hold.title} <span className='text-gray-500'>({hold.id})</span>: Held by ruling of {rulingDate(hold.ruledOn)} — mechanism demonstration only
                                    </p>
                                ))}
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

                        {/*
                          * 15 October 2026. Christian, item 1: "I would prefer that the activity's constraints be
                          * selected based on their documented relationship to the approved context, Game Problem, and
                          * target affordances … flag any missing knowledge rather than filling gaps through
                          * inference." Whose authority the constraints carry, and — for a goal with an authorization
                          * record — the record as selection used it: what it authorizes, what it excludes, and each
                          * manipulation the context names with its source and status. Technical account only;
                          * nothing here is coach-facing. Wording is a DRAFT.
                          */}
                        {account.constraintSource?.constraintAuthority && (
                            <AccountField label='Constraint authority'>
                                {account.constraintSource.constraintAuthority === 'AUTHORIZATION_RECORD'
                                    ? 'Authorization record'
                                    : 'Vocabulary-derived candidates (not authorized for this goal)'}
                                {account.constraintSource.lensAuthority === 'ENGINE_LENS' && (
                                    <span className='block mt-1 text-xs text-gray-600'>Affordance lenses: engine lenses, not authorized affordance targets</span>
                                )}
                            </AccountField>
                        )}

                        {/*
                          * 15 October 2026 (stage H3). Christian, 16 October reply: "It should also distinguish what was
                          * authorized by existing knowledge from what remains a provisional design choice" — and, item
                          * 10, "a clear refusal and a narrowly described gap". Three lists, each read from the record
                          * as the server sorted it by category; nothing is restated here. The decision and capability
                          * descriptions are our wording, as put to him. Technical account only. Labels are DRAFTS.
                          */}
                        {account.authorizationLists && (
                            <AccountField label='What the record says'>
                                <p className='mb-1 text-xs font-semibold text-gray-700'>Authorized by existing knowledge</p>
                                <ul className='mb-3 space-y-1'>
                                    {account.authorizationLists.authorizedByExistingKnowledge.map((entry, index) => (
                                        <li key={index} className='text-xs'>
                                            {entry.label}
                                            <span className='block text-gray-500'>Sources: {entry.sources.join(' · ')}</span>
                                            {entry.note && <span className='block text-gray-500'>{entry.note}</span>}
                                        </li>
                                    ))}
                                </ul>
                                <p className='mb-1 text-xs font-semibold text-gray-700'>Provisional choices (his, for this activity)</p>
                                <ul className='mb-3 space-y-1'>
                                    {account.authorizationLists.provisionalChoices.map((entry, index) => (
                                        <li key={index} className='text-xs'>
                                            <span className='mr-2'>{entry.label}</span>
                                            {entry.status && (
                                                <Mark positive={entry.status.startsWith('AUTHORIZED')}>
                                                    {entry.gaps.length ? `${entry.status} — waiting on ${entry.gaps.join(', ')}` : entry.status}
                                                </Mark>
                                            )}
                                            {entry.words && (
                                                <span className='block text-gray-600'>
                                                    "{entry.words}"{entry.citedAs ? ` (${entry.citedAs})` : ''}
                                                </span>
                                            )}
                                            {entry.sources.length > 0 && <span className='block text-gray-600'>Basis: {entry.sources.join(' · ')}</span>}
                                        </li>
                                    ))}
                                </ul>
                                {/*
                                  * 17 October 2026 (stage M4). Every decision and capability the record named had been ruled on by
                                  * his 19 October reply, and this list still read "still needed" for all of them. Split: a gap is
                                  * settled only where the record carries his words settling it (`settledBy`) and no entry waits on it;
                                  * everything else stays under "still needed". Labels are DRAFTS.
                                  */}
                                <p className='mb-1 text-xs font-semibold text-gray-700'>Gaps: decisions and capabilities still needed</p>
                                <ul className='mb-3 space-y-1'>
                                    {account.authorizationLists.gaps.filter((gap) => gap.neededBy.length > 0 || !(gap.settledBy ?? []).length).length === 0 && (
                                        <li className='text-xs text-gray-500'>None.</li>
                                    )}
                                    {account.authorizationLists.gaps
                                        .filter((gap) => gap.neededBy.length > 0 || !(gap.settledBy ?? []).length)
                                        .map((gap) => (
                                            <li key={gap.id} className='text-xs'>
                                                <span className='mr-2 font-mono'>{gap.id}</span>
                                                <span className='mr-2 text-gray-500'>({gap.kind.toLowerCase()})</span>
                                                {gap.description}
                                                {gap.neededBy.length > 0 && <span className='block text-amber-700'>Needed by: {gap.neededBy.join(' · ')}</span>}
                                                {gap.note && <span className='block text-gray-500'>{gap.note}</span>}
                                            </li>
                                        ))}
                                </ul>
                                <p className='mb-1 text-xs font-semibold text-gray-700'>Gaps settled by your rulings (history)</p>
                                <ul className='space-y-1'>
                                    {account.authorizationLists.gaps
                                        .filter((gap) => gap.neededBy.length === 0 && (gap.settledBy ?? []).length > 0)
                                        .map((gap) => (
                                            <li key={gap.id} className='text-xs'>
                                                <span className='mr-2 font-mono'>{gap.id}</span>
                                                <span className='mr-2 text-gray-500'>({gap.kind.toLowerCase()})</span>
                                                {gap.description}
                                                {(gap.settledBy ?? []).map((said, index) => (
                                                    <span key={index} className='block text-gray-600'>
                                                        "{said.words}" ({said.citedAs})
                                                    </span>
                                                ))}
                                                {gap.note && <span className='block text-gray-500'>{gap.note}</span>}
                                            </li>
                                        ))}
                                </ul>
                            </AccountField>
                        )}

                        {/*
                          * 15 October 2026 (stage K4). Christian, reply filed 17 October 2026, D6: "please document it as a
                          * knowledge-authorized realization, preserving equal numbers as an alternative." The allocation's
                          * authority as the server sent it — his principle, the relationship he confirmed (18 October, item
                          * 5), what defers to it, his adjustments in his words, the testing boundaries. Technical account
                          * only. Labels are DRAFTS.
                          */}
                        {account.allocation && (
                            <AccountField label='Allocation'>
                                <p className='mb-1 text-xs text-gray-700'>
                                    Principle: "{account.allocation.principle.principle}" ({account.allocation.principle.citedAs})
                                </p>
                                <ul className='mb-2 space-y-1'>
                                    {account.allocation.relationships.map((relationship) => (
                                        <li key={relationship.id} className='text-xs'>
                                            <span className='mr-2 font-mono'>{relationship.id}</span>
                                            {relationship.contextId}
                                            {relationship.manipulationId !== null && ` with ${relationship.manipulationId} ${relationship.manipulationName} (${relationship.manipulationStatus})`} — rows{' '}
                                            {relationship.rows.join(', ')}
                                            <Mark positive={relationship.status === 'CONFIRMED'}>{relationship.status}</Mark>
                                            {relationship.words.length > 0 && (
                                                <span className='block text-gray-600'>
                                                    "{relationship.words.join(' ')}" ({relationship.citedAs})
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                {account.allocation.alternatives.map((alternative) =>
                                    alternative.defersWith !== undefined ? (
                                        <p key={`${alternative.contractId}::${alternative.itemId}`} className='mb-1 text-xs text-gray-600'>
                                            Alternative (yields with {alternative.defersWith}; no deferral of its own): {alternative.contractId}::{alternative.itemId} ({alternative.row}:{' '}
                                            {String(alternative.value)}) — {alternative.defersWith} defers to {alternative.deferredTo.map((ref) => `${ref.contractId}::${ref.itemId}`).join(', ')} under{' '}
                                            {alternative.relationship}
                                        </p>
                                    ) : (
                                        <p key={`${alternative.contractId}::${alternative.itemId}`} className='mb-1 text-xs text-gray-600'>
                                            Alternative (defers, ruling C56): {alternative.contractId}::{alternative.itemId} ({alternative.row}: {String(alternative.value)}) — defers to{' '}
                                            {alternative.deferredTo.map((ref) => `${ref.contractId}::${ref.itemId}`).join(', ')} under {alternative.relationship}
                                        </p>
                                    ),
                                )}
                                {account.allocation.adjustments.length > 0 && (
                                    <ul className='mb-2 space-y-1'>
                                        {account.allocation.adjustments.map((adjustment) => (
                                            <li key={adjustment.id} className='text-xs'>
                                                Adjustment: "{adjustment.words}" ({adjustment.citedAs}; {adjustment.parameter}, {adjustment.role})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {account.allocation.testingBoundaries && (
                                    <p className='text-xs text-gray-600'>
                                        Testing boundaries: {account.allocation.testingBoundaries.players.join(', ')} players — "{account.allocation.testingBoundaries.words}" (
                                        {account.allocation.testingBoundaries.citedAs})
                                    </p>
                                )}
                            </AccountField>
                        )}

                        {account.authorization && (
                            <AccountField label='Authorization record'>
                                <p className='mb-1 text-xs text-gray-600'>
                                    {account.authorization.contextId} · {account.authorization.gameProblemId} · ruled {rulingDate(account.authorization.ruledOn)} by{' '}
                                    {account.authorization.by}
                                </p>
                                {account.authorization.authorizedConstraints === null ? (
                                    <p className='mb-1 text-xs text-amber-700'>
                                        Constraints: not yet evaluated for this goal
                                        {account.constraintSource?.gap ? ` (${account.constraintSource.gap})` : ''} —{' '}
                                        {account.authorization.authorizedConstraintsFinding}
                                    </p>
                                ) : account.authorization.authorizedConstraints.length === 0 ? (
                                    <p className='mb-1 text-xs text-gray-600'>
                                        Constraints: evaluated, none justified for this goal — {account.authorization.authorizedConstraintsFinding}
                                    </p>
                                ) : (
                                    <p className='mb-1 text-xs'>Constraints authorized: {account.authorization.authorizedConstraints.join(', ')}</p>
                                )}
                                {/*
                                  * His provisional choices for this activity (15 October 2026), each labelled provisional
                                  * and cited — never presented as a general rule. Wording is a DRAFT.
                                  */}
                                {(account.authorization.provisionalChoices ?? []).map((choice, index) => (
                                    <p key={index} className='mb-1 text-xs text-gray-600'>
                                        <Mark positive={false}>Provisional choice</Mark> {choice.choice} — "{choice.words}" ({choice.by}, ruled {rulingDate(choice.ruledOn)})
                                    </p>
                                ))}
                                {account.authorization.excluded.map((exclusion) => (
                                    <p key={exclusion.knowledgeId} className='mb-1 text-xs text-amber-700'>
                                        {exclusion.title} <span className='text-gray-500'>({exclusion.knowledgeId})</span>: excluded by ruling of {rulingDate(exclusion.ruledOn)}
                                        {exclusion.heldBy ? ` (also held: ${exclusion.heldBy})` : ''}
                                    </p>
                                ))}
                                <ul className='mt-2 space-y-1'>
                                    {account.authorization.manipulations.map((manipulation, index) => (
                                        <li key={index} className='text-xs'>
                                            <span className='mr-2'>
                                                {manipulation.phrase}
                                                {manipulation.aspect && <span className='text-gray-500'> — {manipulation.aspect}</span>}
                                                {manipulation.tier && <span className='text-gray-500'> ({manipulation.tier.toLowerCase()})</span>}
                                            </span>
                                            <Mark positive={manipulation.status.startsWith('AUTHORIZED')}>{manipulation.status}</Mark>
                                            {manipulation.category && <span className='ml-2 text-gray-500'>{manipulation.category}</span>}
                                            {manipulation.gaps && manipulation.gaps.length > 0 && (
                                                <span className='ml-2 text-amber-700'>waiting on {manipulation.gaps.join(', ')}</span>
                                            )}
                                            <span className='block text-gray-600'>Source: {manipulation.source}</span>
                                            <span className='block text-gray-600'>Basis: {manipulation.statusBasis}</span>
                                            {manipulation.registerRows.length > 0 && (
                                                <span className='block text-gray-500'>Register rows: {manipulation.registerRows.join(', ')}</span>
                                            )}
                                            {manipulation.note && <span className='block text-gray-500'>{manipulation.note}</span>}
                                        </li>
                                    ))}
                                </ul>
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
                                            <li key={name} className='[overflow-wrap:anywhere]'>
                                                {name}: <span className='font-mono text-xs'>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                            </li>
                                        ))}
                                </ul>
                            </AccountField>
                        )}

                        {/*
                          * Role blocks (15 October 2026, his M1): each block was built as its own complete game, so each has
                          * its own checks; the cross-block checks prove the two are the exchange of each other. Labels are
                          * DRAFTS. Shown only for an activity played in role blocks.
                          */}
                        {served?.roleBlocks && (
                            <AccountField label='Role blocks'>
                                <ul className='space-y-1'>
                                    <li>
                                        Roles:{' '}
                                        {served.roleBlocks.roles.map((role) => `${role.role} ("${role.coachNoun}", ${role.nounStatus})`).join(' · ')}
                                    </li>
                                    <li>
                                        Exchange: {served.roleBlocks.exchange} — which block is played first: {served.roleBlocks.firstBlock} (
                                        {served.roleBlocks.firstBlockBasis})
                                    </li>
                                    {served.roleBlocks.blocks.map((block, index) => (
                                        <li key={block.blockId} className='[overflow-wrap:anywhere]'>
                                            Block {index + 1}:{' '}
                                            {Object.entries(block.holders)
                                                .map(([role, holder]) => `${role} held by ${holder}`)
                                                .join(', ')}{' '}
                                            {block.ends && (
                                                <>
                                                    (ends:{' '}
                                                    {Object.entries(block.ends)
                                                        .map(([end, from]) => `${end} held by the team at ${from} in the first block`)
                                                        .join(', ')}
                                                    ){' '}
                                                </>
                                            )}
                                            — Gate A {String(block.integrity?.gateA)}, post-realization gates validated{' '}
                                            {yesNo(block.integrity?.postRealizationValidated)}, fidelity violations {String(block.integrity?.fidelityViolations)}
                                            {block.concreteChecks && block.concreteChecks.length > 0 && (
                                                <span className='block text-gray-600'>
                                                    Checks on this block's realized game: {block.concreteChecks.map((check) => `${check.checkId} ${check.verdict}`).join(' · ')}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                    {served.roleBlocks.checks.map((check) => (
                                        <li key={check.checkId} className='[overflow-wrap:anywhere]'>
                                            {check.checkId} {check.verdict}: {check.what}
                                            {check.problems.length > 0 && <span className='text-amber-700'> — {check.problems.join('; ')}</span>}
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
                                                {instruction.block && <span className='font-normal normal-case'> · block {instruction.block}</span>}
                                                {/* Stage 2C (21 October 2026): said once for blocks that say it alike by role. A DRAFT account label. */}
                                                {instruction.counterparts && <span className='font-normal normal-case'> · said once for every block, each citing its own</span>}
                                                {STATUS_MEANING[instruction.status] && (
                                                    <span className='font-normal normal-case'> — {STATUS_MEANING[instruction.status]}</span>
                                                )}
                                            </p>
                                            <p className='mt-1 text-sm text-gray-800'>{instruction.text}</p>
                                            {/* A consolidated sentence (14 October 2026): the status of each part, so a starting value is visible as one. */}
                                            {(instruction.parts ?? []).length > 1 && (
                                                <ul className='mt-1 space-y-0.5'>
                                                    {instruction.parts!.map((p, partIndex) => (
                                                        <li key={partIndex} className='text-[11px] leading-snug text-gray-600'>
                                                            <span className='font-semibold'>{p.status}</span>
                                                            {STATUS_MEANING[p.status] && <span> — {STATUS_MEANING[p.status]}</span>}: “{p.text.trim()}”
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {/* A sentence said once for every block (stage 2C): its `from` is block 1's citations, labelled so. */}
                                            {instruction.counterparts && (instruction.from ?? []).length > 0 && (
                                                <p className='mt-1 text-[11px] text-gray-500'>{blockNumberLabel(served, (served.roleBlocks?.blocks ?? []).find((block) => !instruction.counterparts!.some((c) => c.blockId === block.blockId))?.blockId)}:</p>
                                            )}
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
                                            {/* And each other block's own citations, kept apart, never pooled into `from` (stage 2C). */}
                                            {(instruction.counterparts ?? []).map((counterpart) => (
                                                <div key={counterpart.blockId}>
                                                    <p className='mt-1 text-[11px] text-gray-500'>{blockNumberLabel(served, counterpart.blockId)}:</p>
                                                    <ul className='mt-1'>
                                                        {counterpart.from.map((path, pathIndex) => (
                                                            <li key={pathIndex} className='font-mono text-[11px] leading-snug text-gray-500 break-all'>
                                                                {path}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
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
                                            <li key={index} className='text-sm [overflow-wrap:anywhere] text-gray-700'>
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
