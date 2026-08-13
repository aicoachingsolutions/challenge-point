/**
 * Session Creation — the planning conversation.
 *
 * Renders Christian's Session Planning Model. The workbook defines the conversation; this file
 * presents it. That split is the whole point of the RC1 package, so there is a hard rule here:
 * NO LEARNING GOALS, PRACTICE SITUATIONS OR PHASES ARE NAMED IN THIS FILE. Everything comes from
 * the registry endpoint. If a coach-facing planning concept ever appears as a string literal below,
 * the knowledge has leaked back into code and the change should be reverted rather than extended.
 *
 * ONE step is defined here rather than in the workbook — Learning Stage — because it comes from the
 * Experience Specification rather than the Session Planning Model. It is marked as such at its
 * definition so the boundary stays legible.
 *
 * CHALLENGE USED TO BE A SECOND ONE, AND IS DELIBERATELY GONE. The Adaptive Learning Architecture
 * Review concluded that Challenge is an emergent property of the learner-environment interaction
 * rather than something a coach can predict before the activity exists or players have interacted
 * with it. Asking for it made the coach guess at an outcome, and the guess then acted as a runtime
 * gate. It now belongs to observation and reflection, not planning.
 *
 * Design rules taken directly from the Experience Specification, and why each shows up in the code:
 *   * ONE MEANINGFUL DECISION PER SCREEN — one step renders at a time, never a long form.
 *   * PROGRESSIVE DISCLOSURE — the Practice Situation step is SKIPPED ENTIRELY when the selected
 *     goal has none, rather than shown empty (Implementation Guide Rule 3). Skipping has to work in
 *     both directions or Back lands the coach on a dead screen.
 *   * COACH LANGUAGE ONLY — no Game Problems, affordances, constraints or representative design
 *     anywhere in the interface.
 *   * GUIDE RATHER THAN VALIDATE — entry-language search filters and suggests; it never overrides
 *     an explicit selection, and never rejects what the coach typed.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

import ROUTES from '@/ROUTES'
import { api } from '@/services/api.service'
import Button from '@/components/Button'

export interface PracticeSituation {
    id: string
    name: string
    definition: string
}

export interface LearningGoal {
    id: string
    name: string
    coachDefinition: string
    chooseThisWhen: string
    practiceSituations: PracticeSituation[]
}

interface PhaseGroup {
    phase: string
    learningGoals: LearningGoal[]
}

interface EntryPhrase {
    phrase: string
    learningGoalId: string
}

interface ClarificationDirection {
    learningGoalId: string
    learningGoal: string
    phase: string
    example: string | null
}

interface Clarification {
    term: string
    question: string
    directions: ClarificationDirection[]
}

interface PlanningRegistry {
    phases: PhaseGroup[]
    entryLanguage: EntryPhrase[]
    clarifications: Clarification[]
    translation: { total: number; populated: number; unpopulated: string[] }
}

/**
 * The coach's planning selections — only things a coach can reasonably know before practice.
 * `learningStage` is an Experience-Specification concept rather than a workbook one; see the header.
 */
export interface PlanningSelection {
    learningGoalId: string
    learningGoalName: string
    practiceSituationId: string | null
    practiceSituationName: string | null
    learningStage: string
    duration: number
    additionalContext: string
}

/**
 * FROM THE EXPERIENCE SPECIFICATION, NOT THE WORKBOOK. Learning Stage describes where players are
 * with today's learning; the spec is explicit that it calibrates challenge rather than changing
 * football content.
 */
const LEARNING_STAGES = [
    { value: 'first_time_exploring', label: 'First Time Exploring', description: 'Players are becoming familiar with this game situation.' },
    { value: 'building_understanding', label: 'Building Understanding', description: 'Players are recognizing useful opportunities more consistently.' },
    { value: 'reinforcing_refining', label: 'Reinforcing & Refining', description: 'Players are ready to perform under increasingly representative pressure.' },
]

/**
 * TEAM CONTEXT — trimmed to what the engine consumes today.
 *
 * The Experience Specification describes Team Profiles carrying reusable defaults for player count,
 * equipment, duration and field dimensions. Only duration reaches generation at the moment, so only
 * duration is asked. Asking for the rest now would break the spec's own rule that every question
 * must materially improve the generated activity — they become questions the moment they influence
 * something.
 */
const DURATION_OPTIONS = [15, 20, 25, 30, 40, 45]

type StepId = 'goal' | 'situation' | 'stage' | 'team' | 'context'

/** The coach-facing question for each step, verbatim from the Experience Specification. */
const STEP_QUESTIONS: Record<StepId, string> = {
    goal: 'What are your players trying to handle better during the game?',
    situation: 'Can you tell us a little more about this situation?',
    stage: 'Where are your players with this learning today?',
    team: 'Tell us about today’s practice.',
    context: 'Is there anything else we should know?',
}

interface Props {
    onComplete: (selection: PlanningSelection) => void
    onCancel?: () => void
    submitting?: boolean
}

export default function SessionPlanningConversation({ onComplete, onCancel, submitting = false }: Props) {
    const [registry, setRegistry] = useState<PlanningRegistry | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [step, setStep] = useState<StepId>('goal')

    const [search, setSearch] = useState('')
    const [goalId, setGoalId] = useState<string | null>(null)
    const [situationId, setSituationId] = useState<string | null>(null)
    const [learningStage, setLearningStage] = useState<string | null>(null)
    const [duration, setDuration] = useState<number | null>(null)
    const [additionalContext, setAdditionalContext] = useState('')

    useEffect(() => {
        let cancelled = false
        api<PlanningRegistry>(ROUTES.app.sessionPlanning).then((response) => {
            if (cancelled) return
            if (!response.data || response.error || (response.status ?? 500) >= 400) {
                // The registry IS the conversation, so there is no degraded mode worth offering —
                // saying so plainly beats rendering an empty picker that looks like "no goals exist".
                setLoadError('We could not load the planning options. Please refresh to try again.')
                return
            }
            setRegistry(response.data)
        })
        return () => {
            cancelled = true
        }
    }, [])

    const allGoals = useMemo(
        () => (registry?.phases ?? []).flatMap((group) => group.learningGoals.map((goal) => ({ ...goal, phase: group.phase }))),
        [registry]
    )
    const selectedGoal = useMemo(() => allGoals.find((goal) => goal.id === goalId) ?? null, [allGoals, goalId])

    /**
     * GUIDED CLARIFICATION. A coach who opens with a broad term — "defending", "possession" — has not
     * yet expressed a planning intention, so the platform asks rather than guesses. Christian's
     * words: a coach saying "today we're working on defending" hasn't said what players are trying to
     * handle better, any more than "attacking" would.
     *
     * This GUIDES, it does not validate. The full list stays visible underneath, nothing is rejected,
     * and the coach can ignore the prompt entirely — per the spec, "the objective is not validation".
     */
    const clarification = useMemo(() => {
        const needle = search.trim().toLowerCase()
        if (!needle) return null
        return (registry?.clarifications ?? []).find((c) => c.term === needle) ?? null
    }, [registry, search])
    const situations = selectedGoal?.practiceSituations ?? []

    /**
     * Entry-language search. Matches the goal's own name AND the coach phrases mapped to it, so a
     * coach who types their own words finds the goal without having to learn ours — the sheet's
     * stated purpose. A phrase match never selects anything on the coach's behalf.
     */
    const matchesSearch = useCallback(
        (goal: LearningGoal): boolean => {
            const needle = search.trim().toLowerCase()
            if (!needle) return true
            if (goal.name.toLowerCase().includes(needle)) return true
            if (goal.coachDefinition.toLowerCase().includes(needle)) return true
            return (registry?.entryLanguage ?? []).some(
                (entry) => entry.learningGoalId === goal.id && entry.phrase.toLowerCase().includes(needle)
            )
        },
        [registry, search]
    )

    /**
     * Progressive disclosure, in both directions. The Practice Situation step must not appear when
     * the selected goal has none — and Back has to skip it too, or the coach lands on a screen with
     * nothing on it and no way forward.
     */
    const order: StepId[] = useMemo(() => {
        const steps: StepId[] = ['goal']
        if (situations.length > 0) steps.push('situation')
        return [...steps, 'stage', 'team', 'context']
    }, [situations.length])

    const goNext = () => {
        const index = order.indexOf(step)
        if (index >= 0 && index < order.length - 1) setStep(order[index + 1])
    }
    const goBack = () => {
        const index = order.indexOf(step)
        if (index > 0) setStep(order[index - 1])
    }

    const selectGoal = (goal: LearningGoal) => {
        setGoalId(goal.id)
        // A different goal makes any previous situation meaningless — carrying it over would attach
        // a situation from another goal to this one.
        setSituationId(null)
        setStep(goal.practiceSituations.length > 0 ? 'situation' : 'stage')
    }

    const complete = () => {
        if (!selectedGoal || !learningStage || !duration) return
        const situation = situations.find((s) => s.id === situationId) ?? null
        onComplete({
            learningGoalId: selectedGoal.id,
            learningGoalName: selectedGoal.name,
            practiceSituationId: situation?.id ?? null,
            practiceSituationName: situation?.name ?? null,
            learningStage,
            duration,
            additionalContext: additionalContext.trim(),
        })
    }

    if (loadError) {
        return (
            <div className='p-6 border border-red-200 rounded-lg bg-red-50'>
                <p className='text-red-800'>{loadError}</p>
            </div>
        )
    }

    if (!registry) {
        return <div className='p-6 text-gray-500'>Loading planning options…</div>
    }

    const stepNumber = order.indexOf(step) + 1

    return (
        <div className='max-w-2xl mx-auto'>
            <div className='mb-6'>
                <p className='mb-1 text-sm text-gray-500'>
                    Step {stepNumber} of {order.length}
                </p>
                <h2 className='text-2xl font-semibold text-gray-900'>{STEP_QUESTIONS[step]}</h2>
            </div>

            {step === 'goal' && (
                <div>
                    <input
                        type='text'
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder='Search in your own words — e.g. “build from the back”'
                        className='w-full px-4 py-3 mb-5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    {clarification && (
                        <div className='p-4 mb-5 border rounded-lg border-blue-200 bg-blue-50'>
                            <p className='font-medium text-gray-900'>{clarification.question}</p>
                            <p className='mt-1 text-sm text-gray-600'>
                                Pick a direction, or keep browsing below — either is fine.
                            </p>
                            <div className='mt-3 space-y-2'>
                                {clarification.directions.map((direction) => {
                                    const goal = allGoals.find((g) => g.id === direction.learningGoalId)
                                    return (
                                        <button
                                            key={direction.learningGoalId}
                                            type='button'
                                            onClick={() => goal && selectGoal(goal)}
                                            className='w-full p-3 text-left transition bg-white border border-gray-200 rounded-lg hover:border-blue-500'
                                        >
                                            <span className='font-medium text-gray-900'>{direction.learningGoal}</span>
                                            {direction.example && (
                                                <span className='block mt-0.5 text-sm text-gray-600'>
                                                    for example, {direction.example.toLowerCase()}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {registry.phases.map((group) => {
                        const goals = group.learningGoals.filter(matchesSearch)
                        if (goals.length === 0) return null
                        return (
                            <div key={group.phase} className='mb-6'>
                                <h3 className='mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase'>{group.phase}</h3>
                                <div className='space-y-2'>
                                    {goals.map((goal) => (
                                        <button
                                            key={goal.id}
                                            type='button'
                                            onClick={() => selectGoal(goal)}
                                            className={`w-full p-4 text-left border rounded-lg transition hover:border-blue-500 hover:bg-blue-50 ${
                                                goalId === goal.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                                            }`}
                                        >
                                            <span className='block font-medium text-gray-900'>{goal.name}</span>
                                            <span className='block mt-1 text-sm text-gray-600'>{goal.coachDefinition}</span>
                                            {goal.chooseThisWhen && (
                                                <span className='block mt-2 text-sm italic text-gray-500'>{goal.chooseThisWhen}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                    {/* Guide, never validate: an unmatched search is not an error state. */}
                    {registry.phases.every((group) => group.learningGoals.filter(matchesSearch).length === 0) && (
                        <p className='text-gray-600'>
                            Nothing matched “{search}”. Try different words, or clear the search to see every option.
                        </p>
                    )}
                </div>
            )}

            {step === 'situation' && selectedGoal && (
                <div className='space-y-2'>
                    <p className='mb-4 text-gray-600'>{selectedGoal.name}</p>
                    {situations.map((situation) => (
                        <button
                            key={situation.id}
                            type='button'
                            onClick={() => {
                                setSituationId(situation.id)
                                goNext()
                            }}
                            className={`w-full p-4 text-left border rounded-lg transition hover:border-blue-500 hover:bg-blue-50 ${
                                situationId === situation.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                            }`}
                        >
                            <span className='block font-medium text-gray-900'>{situation.name}</span>
                            {situation.definition && <span className='block mt-1 text-sm text-gray-600'>{situation.definition}</span>}
                        </button>
                    ))}
                    {/* Optional by design — the coach should not be forced to narrow if none fits. */}
                    <button type='button' onClick={goNext} className='pt-2 text-sm text-gray-500 underline'>
                        None of these — continue
                    </button>
                </div>
            )}

            {step === 'stage' && (
                <div className='space-y-2'>
                    {LEARNING_STAGES.map((option) => (
                        <button
                            key={option.value}
                            type='button'
                            onClick={() => {
                                setLearningStage(option.value)
                                goNext()
                            }}
                            className={`w-full p-4 text-left border rounded-lg transition hover:border-blue-500 hover:bg-blue-50 ${
                                learningStage === option.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                            }`}
                        >
                            <span className='block font-medium text-gray-900'>{option.label}</span>
                            <span className='block mt-1 text-sm text-gray-600'>{option.description}</span>
                        </button>
                    ))}
                </div>
            )}

            {step === 'team' && (
                <div className='space-y-2'>
                    <p className='mb-4 text-gray-600'>How long is this activity?</p>
                    <div className='flex flex-wrap gap-2'>
                        {DURATION_OPTIONS.map((minutes) => (
                            <button
                                key={minutes}
                                type='button'
                                onClick={() => {
                                    setDuration(minutes)
                                    goNext()
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
            )}

            {step === 'context' && (
                <div>
                    <textarea
                        value={additionalContext}
                        onChange={(event) => setAdditionalContext(event.target.value)}
                        rows={4}
                        placeholder='e.g. We panic after winning possession.'
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <p className='mt-2 text-sm text-gray-500'>Optional — this adds detail to the activity.</p>
                    <Button className='mt-5' onClick={complete} disabled={submitting}>
                        {submitting ? 'Generating…' : 'Generate activity'}
                    </Button>
                </div>
            )}

            <div className='flex items-center gap-4 pt-6 mt-8 border-t border-gray-200'>
                {order.indexOf(step) > 0 && (
                    <button type='button' onClick={goBack} className='text-sm text-gray-600 underline'>
                        Back
                    </button>
                )}
                {onCancel && (
                    <button type='button' onClick={onCancel} className='text-sm text-gray-500 underline'>
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )
}
