import {
    ArrowLeftCircleIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ClipboardDocumentIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { NumberField, SelectField, TextAreaField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { ActivityStatus, ChallengeLevels, IActivity } from '@/MODELS/activity.model'
import { SessionStatus } from '@/MODELS/session.model'

import { api } from '@/services/api.service'

import Button from '@/components/Button'
import SessionPlanningConversation, { type PlanningSelection } from './SessionPlanningConversation'

// "Environmental Fit" (coach-facing rename of Challenge Level — Christian's MVP2 wording).
// The enum values (low/medium/high) are unchanged so nothing downstream breaks; only the
// coach-facing display label + description change. Per Christian's label/description guardrail:
// labels are simple and familiar (Comfortable / Stretch / Demanding); the description carries
// the teaching and communicates ENVIRONMENTAL DEMAND rather than expected failure.
const ENVIRONMENTAL_FIT_OPTIONS: { value: ChallengeLevels; label: string; description: string }[] = [
    {
        value: ChallengeLevels['Low-Pressure Learning'],
        label: 'Comfortable',
        description: 'Players succeed often with more time, space, and support available.',
    },
    {
        value: ChallengeLevels['Growth Zone'],
        label: 'Stretch',
        description: 'Players are challenged while still finding success regularly.',
    },
    {
        value: ChallengeLevels['High Pressure Challenge'],
        label: 'Demanding',
        description: 'Players face tighter pressure, less time, and fewer stable solutions.',
    },
]
const challengeLevelOptions = ENVIRONMENTAL_FIT_OPTIONS.map((o) => ({ value: o.value, text: o.label }))

/**
 * What the guided flow sends now that it no longer asks the coach for Challenge.
 *
 * The Adaptive Learning Architecture Review concluded that Challenge is an emergent property of the
 * learner-environment interaction, so the coach is no longer asked to predict it. The engine still
 * needs a value: Experience Design reads it as an appropriateness signal when choosing a
 * Representative Intervention.
 *
 * The middle value is used deliberately rather than as a shrug. It is the neutral position, and it
 * is the one Decision 1 treats as "evaluate enhancement" — which keeps Experience Design active,
 * per the review's Finding 6 that meaningful environmental design matters at every challenge state
 * rather than only at high ones.
 *
 * THIS IS A PLACEHOLDER FOR A CALIBRATION MODEL THAT DOES NOT EXIST YET. When the closed loop is
 * built, this value should come from observation and Team Profile calibration rather than from a
 * constant. It is named so that it is findable then, instead of being an unexplained literal.
 */
const RUNTIME_CHALLENGE_DEFAULT = ChallengeLevels['Growth Zone']

export default function ActivityGenerator() {
    const { id } = useParams()
    type GenerationStatus = 'creation' | 'generation' | 'selection'
    const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('creation')
    const [generationError, setGenerationError] = useState<string | null>(null)
    /** Concrete goals offered alongside a rejection, so the coach has a next step rather than a wall. */
    const [generationSuggestions, setGenerationSuggestions] = useState<string[]>([])
    /** Set when the engine read the goal broadly rather than precisely. Null on a confident match. */
    const [resolutionNotice, setResolutionNotice] = useState<{ message: string; suggestions: string[] } | null>(null)
    const [selectedChallengeLevel, setSelectedChallengeLevel] = useState<ChallengeLevels>()
    const [selectedDuration, setSelectedDuration] = useState<number>()
    const [selectedLearningGoals, setSelectedLearningGoals] = useState<string[]>([])
    const [generatedActivities, setGeneratedActivities] = useState<IActivity[]>([])
    const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
    // Developer debug mode (Christian's debug system) — a checkbox on the creation screen renders
    // the resolution/selection trace + AI-stage validation next to the real generated activities;
    // ?debug=1 in the URL also forces it on. TEMPORARY, pre-field-test: shown to all signed-in
    // users because the primary tester's account isn't flagged admin. Re-gate before broader release.
    const [debugToggle, setDebugToggle] = useState(false)
    const [useGuidedPlanning, setUseGuidedPlanning] = useState(true)
    const debugMode = debugToggle || new URLSearchParams(window.location.search).get('debug') === '1'
    const [debugTrace, setDebugTrace] = useState<Record<string, any> | null>(null)
    const navigate = useNavigate()

    /**
     * The coach sees ONE message in one voice. The server's `stage` and `details` are internal —
     * they used to be concatenated onto the friendly text, producing "input-selection: I couldn't
     * match that… No supported soccer training signals were found." Three registers, one bubble.
     * They are now debug-only and stay out of the coach's way.
     */
    const buildGenerationErrorMessage = (errorResponse?: { error?: string; message?: string }) =>
        errorResponse?.error ??
        errorResponse?.message ??
        'Unable to generate activities right now. Please review your inputs and try again.'

    const resetGenerationState = (message?: string, nextSuggestions: string[] = []) => {
        setGeneratedActivities([])
        setCurrentActivityIndex(0)
        setGenerationStatus('creation')
        setGenerationError(message ?? 'Unable to generate activities right now. Please review your inputs and try again.')
        setGenerationSuggestions(nextSuggestions)
    }

    /**
     * Put a suggested goal where the coach can generate from it immediately. Fills the first blank
     * goal row if there is one, otherwise adds a row — a rejection should leave them one click from
     * trying again, not retyping.
     */
    const applySuggestedGoal = (goal: string) => {
        setSelectedLearningGoals((current) => {
            const blankIndex = current.findIndex((g) => !g.trim())
            if (blankIndex >= 0) {
                const next = [...current]
                next[blankIndex] = goal
                return next
            }
            return [...current, goal]
        })
        setGenerationError(null)
        setGenerationSuggestions([])
    }

    /** Suggestions travel with the error payload, so pull them from whichever shape came back. */
    const suggestionsFrom = (payload: unknown): string[] => {
        if (!payload || typeof payload !== 'object') return []
        const raw = (payload as { suggestions?: unknown }).suggestions
        return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : []
    }

    /**
     * Run generation from the guided planning conversation.
     *
     * PROVISIONAL BRIDGE. Christian's Engine Translation sheet — Learning Goal → Game Problem IDs —
     * is unpopulated at RC1, so the structured selections cannot yet route structurally. Until it is
     * filled in, the goal and situation NAMES are passed as the goal text and routed by the existing
     * parser, which is the same path the free-text form uses and is already gated.
     *
     * This is deliberately the weakest part of the flow and is meant to be replaced, not built on.
     * Two of the eleven Learning Goals ("Play Out from the Back", "Beat Defenders 1v1") only reach
     * the general fallback this way, which is a knowledge gap the bridge will close.
     */
    const generateFromPlanning = async (selection: PlanningSelection) => {
        const goalText = [selection.learningGoalName, selection.practiceSituationName, selection.additionalContext]
            .filter(Boolean)
            .join('. ')

        setSelectedChallengeLevel(RUNTIME_CHALLENGE_DEFAULT)
        setSelectedDuration(selection.duration)
        setSelectedLearningGoals([goalText])
        await generateActivities({
            challengeLevel: RUNTIME_CHALLENGE_DEFAULT,
            duration: selection.duration,
            learningGoals: [goalText],
            // Sent for EVIDENCE, not for routing. Learning Stage does not yet influence generation
            // — the interaction between it and Challenge is a coaching judgement Christian still
            // owns — so recording what coaches actually choose is what will let him define it
            // against a real distribution rather than in the abstract.
            planning: {
                learningGoalId: selection.learningGoalId,
                practiceSituationId: selection.practiceSituationId,
                learningStage: selection.learningStage,
            },
        })
    }

    const generateActivities = async (override?: {
        challengeLevel: ChallengeLevels
        duration: number
        learningGoals: string[]
        planning?: {
            learningGoalId: string
            practiceSituationId: string | null
            learningStage: string
        }
    }) => {
        const challengeLevel = override?.challengeLevel ?? selectedChallengeLevel
        const duration = override?.duration ?? selectedDuration
        const learningGoals = override?.learningGoals ?? selectedLearningGoals

        if (!challengeLevel || !duration) {
            return
        }

        setGenerationError(null)
        setGenerationSuggestions([])
        setResolutionNotice(null)
        setDebugTrace(null)
        setGenerationStatus('generation')

        try {
            const res = await api<any>(`${ROUTES.app.generateActivities}/${id}`, {
                challengeLevel,
                duration,
                learningGoals,
                ...(override?.planning ? { planning: override.planning } : {}),
                ...(debugMode ? { debug: true } : {}),
            })

            // The endpoint returns { activities, resolutionStatus, notice?, debugTrace? }. It used
            // to return a bare array in non-debug mode, so we still accept that shape — a client
            // running against an older deployment keeps working.
            const payload: any = res.data
            const wrapped = payload && typeof payload === 'object' && !Array.isArray(payload)
            const activities = wrapped ? payload.activities : payload

            if (debugMode) {
                setDebugTrace(wrapped && payload.debugTrace ? payload.debugTrace : null)
            }

            if (res.error || !Array.isArray(activities)) {
                const errorPayload = wrapped ? payload : res
                resetGenerationState(buildGenerationErrorMessage(errorPayload), suggestionsFrom(errorPayload))
                return
            }

            // Only present when the engine read the goal broadly rather than precisely — a
            // confident match sends nothing, and the coach sees no banner at all.
            setResolutionNotice(wrapped && payload.notice ? payload.notice : null)
            setCurrentActivityIndex(0)
            setGeneratedActivities(activities)
            setGenerationStatus('selection')
        } catch (error) {
            const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined

            if (status === 401) {
                return
            }

            resetGenerationState()
        }
    }

    const selectActivity = async (
        selectedActivity: IActivity,
        challengeLevel: ChallengeLevels,
        duration: number,
        learningGoals: string[]
    ) => {
        const destinationRoute = selectedActivity._id ? `/activity/${selectedActivity._id}` : '/activity/{new}'
        console.log('Start Activity clicked', {
            activityId: selectedActivity._id,
            sessionId: id,
            currentStatus: selectedActivity.activityStatus,
            destinationRoute,
        })

        if (!id) {
            console.error('Missing activity id/session id for Start Activity')
            setGenerationError('Missing activity id/session id for Start Activity')
            return
        }

        const activityPayload: Omit<Partial<IActivity>, 'session'> & { _id: 'new'; session: string } = {
            _id: 'new',
            activityStatus: ActivityStatus['In Progress'],
            session: id,
            title: selectedActivity.title,
            constraint: selectedActivity.constraint,
            intent: selectedActivity.intent,
            // Pass through the AI-written setup description so the saved activity (which the
            // coach navigates to in the detail view) retains it. Without this, the generator
            // view shows Setup but the saved activity in ActivityPage doesn't.
            setup: selectedActivity.setup,
            extensions: selectedActivity.extensions ?? [],
            scaffolding: selectedActivity.scaffolding ?? [],
            playerGroupSizes: selectedActivity.playerGroupSizes,
            equipmentNeeded: selectedActivity.equipmentNeeded ?? [],
            rules: selectedActivity.rules ?? [],
            scoringSystem: selectedActivity.scoringSystem,
            winCondition: selectedActivity.winCondition,
            systemTrace: selectedActivity.systemTrace,
            challengeLevel,
            duration,
            learningPriorities: learningGoals.map((lg) => ({ description: lg, achieved: false })),
        }
        console.log('Start Activity create payload', {
            _id: activityPayload._id,
            activityStatus: activityPayload.activityStatus,
            session: activityPayload.session,
            title: activityPayload.title,
            hasConstraint: Boolean(activityPayload.constraint),
            hasIntent: Boolean(activityPayload.intent),
            playerGroupSizes: activityPayload.playerGroupSizes,
            equipmentNeededCount: activityPayload.equipmentNeeded?.length ?? 0,
            scaffoldingCount: activityPayload.scaffolding?.length ?? 0,
            extensionsCount: activityPayload.extensions?.length ?? 0,
            rulesCount: activityPayload.rules?.length ?? 0,
            challengeLevel: activityPayload.challengeLevel,
            duration: activityPayload.duration,
        })

        const res = await api<{ data: IActivity }>(`${ROUTES.app.activity}`, activityPayload)
        console.log('Start Activity create response', {
            endpoint: ROUTES.app.activity,
            payload: {
                _id: activityPayload._id,
                activityStatus: activityPayload.activityStatus,
                session: activityPayload.session,
            },
            status: res.status,
            body: res.data,
            error: res.error,
        })

        const createdActivity = res.data?.data
        if (res.error || !createdActivity?._id) {
            const message = res.error ?? 'Unable to start activity. Please try again.'
            console.error('Failed to start activity', { status: res.status, error: message, body: res.data })
            setGenerationError(message)
            return
        }

        const route = `/activity/${createdActivity._id}`
        console.log('Start Activity navigating', {
            activityId: createdActivity._id,
            sessionId: id,
            currentStatus: createdActivity.activityStatus,
            destinationRoute: route,
        })
        navigate(route)

        const sessionRes = await api(ROUTES.app.session, { _id: id, sessionStatus: SessionStatus['In Progress'] })
        if (sessionRes.error) {
            console.error('Failed to update session status after starting activity', {
                status: sessionRes.status,
                error: sessionRes.error,
            })
        }
    }

    const nextActivity = useCallback(() => {
        if (generatedActivities.length === 0) return
        setCurrentActivityIndex((prevIndex) => (prevIndex === generatedActivities.length - 1 ? 0 : prevIndex + 1))
    }, [generatedActivities])

    const prevActivity = useCallback(() => {
        if (generatedActivities.length === 0) return
        setCurrentActivityIndex((prevIndex) => (prevIndex === 0 ? generatedActivities.length - 1 : prevIndex - 1))
    }, [generatedActivities])

    return (
        <div className='flex flex-col justify-center pt-2'>

            {/* Developer debug trace (only with ?debug=1). Shows the resolution/selection chain that
                produced THIS generation + the AI-stage validation result, next to the real output. */}
            {debugMode && debugTrace && (
                <div className='max-w-3xl p-4 mx-auto mb-4 text-xs border border-dashed rounded-xl border-slate-300 bg-slate-50'>
                    <p className='mb-2 text-sm font-bold text-slate-700'>Debug trace (developer view)</p>
                    {debugTrace.validation && (
                        <div
                            className={`px-3 py-2 mb-3 rounded ${
                                debugTrace.validation.aiStagePass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                        >
                            AI-stage validation: {debugTrace.validation.aiStagePass ? 'PASS' : 'FAIL'}
                            {!debugTrace.validation.aiStagePass && debugTrace.validation.failureReason && (
                                <div className='mt-1'>
                                    <span className='font-semibold'>{debugTrace.validation.failureStage}</span> —{' '}
                                    {debugTrace.validation.failureReason}
                                </div>
                            )}
                        </div>
                    )}
                    {debugTrace.resolution && (
                        <div className='mb-2 text-slate-700'>
                            <div>
                                <span className='font-semibold'>Resolved problem:</span>{' '}
                                {(debugTrace.resolution.resolvedGameProblem ?? []).join(', ')}
                            </div>
                            <div>
                                <span className='font-semibold'>Role context:</span>{' '}
                                {debugTrace.resolution.roleContextDetected}
                            </div>
                        </div>
                    )}
                    {debugTrace.selection && (
                        <div className='text-slate-700'>
                            <div>
                                <span className='font-semibold'>Archetype:</span>{' '}
                                {debugTrace.selection.selectedArchetype?.name} ({debugTrace.selection.selectedArchetype?.id})
                            </div>
                            <div>
                                <span className='font-semibold'>Affordances:</span>{' '}
                                {(debugTrace.selection.selectedAffordances ?? []).join(', ')}
                            </div>
                            <div>
                                <span className='font-semibold'>Constraints:</span>{' '}
                                {(debugTrace.selection.selectedConstraints ?? []).join(', ')}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {generationStatus === 'generation' && (
                <div className='w-full max-w-sm p-4 mx-auto text-center sm:max-w-md sm:p-6'>
                    <div className='mb-6 sm:mb-8'>
                        <div className='flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full shadow-lg sm:w-24 sm:h-24 sm:mb-6 bg-gradient-to-br from-brand-100 to-brand-200'>
                            <div className='w-12 h-12 border-4 rounded-full sm:w-16 sm:h-16 border-brand-300 border-t-brand-600 animate-spin'></div>
                        </div>
                        <h2 className='mb-2 text-xl font-bold text-gray-900 sm:mb-3 sm:text-2xl'>
                            Building Your Activities
                        </h2>
                        <p className='px-2 text-sm text-gray-600 sm:text-base'>
                            The system is selecting the activity structure and AI is assembling concrete options...
                        </p>
                    </div>

                    <div className='p-4 space-y-2 text-left border sm:space-y-3 bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl sm:p-5 border-brand-200'>
                        <div className='flex items-center text-sm text-gray-700'>
                            <div className='w-2.5 h-2.5 mr-3 bg-brand-600 rounded-full animate-pulse'></div>
                            <span className='font-medium'>Analyzing session requirements</span>
                        </div>
                        <div className='flex items-center text-sm text-gray-700'>
                            <div
                                className='w-2.5 h-2.5 mr-3 bg-brand-600 rounded-full animate-pulse'
                                style={{ animationDelay: '0.5s' }}
                            ></div>
                            <span className='font-medium'>Matching challenge level</span>
                        </div>
                        <div className='flex items-center text-sm text-gray-700'>
                            <div
                                className='w-2.5 h-2.5 mr-3 bg-brand-600 rounded-full animate-pulse'
                                style={{ animationDelay: '1s' }}
                            ></div>
                            <span className='font-medium'>Customizing learning goals</span>
                        </div>
                        <div className='flex items-center text-sm text-gray-700'>
                            <div
                                className='w-2.5 h-2.5 mr-3 bg-brand-600 rounded-full animate-pulse'
                                style={{ animationDelay: '1.5s' }}
                            ></div>
                            <span className='font-medium'>Finalizing activity details</span>
                        </div>
                    </div>

                    <p className='mt-4 text-xs text-gray-500 sm:text-sm sm:mt-6'>This usually takes 10-15 seconds</p>
                </div>
            )}
            {/*
              * The guided planning conversation is the primary Session Creation experience, per
              * Christian's Experience Specification. The free-text form stays reachable behind a
              * link rather than being deleted: it is the proven path, the guided flow still routes
              * through a provisional bridge, and pilots are imminent. Remove it once Engine
              * Translation is populated and the guided path is demonstrably at least as good.
              */}
            {generationStatus === 'creation' && useGuidedPlanning && (
                <div className='w-full p-4 mx-auto sm:p-6 lg:p-8'>
                    <SessionPlanningConversation onComplete={generateFromPlanning} />
                    <div className='max-w-2xl mx-auto mt-8 text-center'>
                        <button
                            type='button'
                            onClick={() => setUseGuidedPlanning(false)}
                            className='text-sm text-gray-500 underline'
                        >
                            Prefer to describe it in your own words?
                        </button>
                    </div>
                </div>
            )}
            {generationStatus === 'creation' && !useGuidedPlanning && (
                <div className='w-full max-w-lg p-4 mx-auto sm:max-w-xl lg:max-w-2xl sm:p-6 lg:p-8'>
                    {/* Header Section */}
                    <div className='mb-6 text-center sm:mb-8'>
                        <div className='flex items-center justify-center w-10 h-10 mx-auto mb-3 rounded-full sm:w-16 sm:h-16 sm:mb-4 bg-brand-100'>
                            <ClipboardDocumentIcon className='w-5 h-5 sm:w-8 sm:h-8 text-brand-600' />
                        </div>
                        <h2 className='px-2 mb-2 text-xl font-bold text-gray-900 sm:text-2xl'>Create New Activity</h2>
                        <p className='max-w-xl px-4 mx-auto text-sm text-gray-600 sm:text-base'>
                            Tell us about your players and session goals so the engine can assemble the right activity options
                        </p>
                    </div>

                    {/* Form Fields */}
                    <div className='space-y-6 sm:space-y-8'>
                        {generationError && (
                            <div className='px-4 py-3 text-sm border rounded-xl border-amber-200 bg-amber-50 text-amber-800'>
                                <p>{generationError}</p>
                                {generationSuggestions.length > 0 && (
                                    <>
                                        <p className='mt-3 font-medium'>Try one of these:</p>
                                        <div className='flex flex-wrap gap-2 mt-2'>
                                            {generationSuggestions.map((goal) => (
                                                <button
                                                    key={goal}
                                                    type='button'
                                                    onClick={() => applySuggestedGoal(goal)}
                                                    className='px-3 py-1.5 text-sm text-left transition-colors bg-white border rounded-lg border-amber-300 text-amber-900 hover:bg-amber-100'
                                                >
                                                    {goal}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Environmental Fit (formerly Challenge Level) */}
                        <div>
                            <SelectField
                                label='Environmental Fit'
                                value={selectedChallengeLevel || ''}
                                onChange={(value) => setSelectedChallengeLevel(value as ChallengeLevels)}
                                options={challengeLevelOptions}
                                placeholder='Select the environmental fit for this activity'
                                labelClass='text-gray-700 font-medium mb-2 block'
                                inputClass='text-base'
                                className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                            />
                            <p className='mt-2 text-sm text-gray-500'>
                                {ENVIRONMENTAL_FIT_OPTIONS.find((o) => o.value === selectedChallengeLevel)?.description ??
                                    'How much demand the activity places on players — more support and time, or tighter pressure and fewer easy solutions.'}
                            </p>
                        </div>

                        {/* Duration */}
                        <div>
                            <NumberField
                                label='Duration'
                                value={selectedDuration}
                                onChange={(value) =>
                                    setSelectedDuration(
                                        typeof value === 'string' ? parseInt(value) || undefined : value
                                    )
                                }
                                step={5}
                                placeholder='Activity duration in minutes'
                                labelClass='text-gray-700 font-medium mb-2 block'
                                inputClass='text-base'
                                className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                min={0}
                            />
                            <p className='mt-2 text-sm text-gray-500'>Enter the desired duration for this activity</p>
                        </div>

                        {/* Learning Goals */}
                        <div>
                            <label className='block mb-2 font-medium text-gray-700'>Learning Goals</label>
                            <p className='mb-2 text-sm text-gray-500'>
                                Which game moments do your players need help with? (e.g. breaking lines, keeping
                                possession under pressure, defending transitions, creating space)
                            </p>

                            <div className='space-y-3'>
                                {selectedLearningGoals.map((goal, index) => (
                                    <div key={index} className='flex items-center gap-3'>
                                        <div className='flex-1'>
                                            <TextAreaField
                                                value={goal}
                                                onChange={(value) => {
                                                    const newGoals = [...selectedLearningGoals]
                                                    newGoals[index] = value
                                                    setSelectedLearningGoals(newGoals)
                                                }}
                                                rows={3}
                                                placeholder='Include game-specific behaviors e.g. Improve first touch under pressure, Better decision making in tight spaces'
                                                className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                                inputClass='text-sm'
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newGoals = selectedLearningGoals.filter((_, i) => i !== index)
                                                setSelectedLearningGoals(newGoals)
                                            }}
                                            className='flex items-center justify-center w-10 h-10 mt-1 text-red-600 transition-colors bg-red-100 rounded-xl hover:bg-red-200'
                                        >
                                            <XMarkIcon className='w-5 h-5' />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => setSelectedLearningGoals([...selectedLearningGoals, ''])}
                                    className='w-full px-6 py-4 text-base text-gray-600 transition-colors border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 hover:border-gray-400'
                                >
                                    + Add Learning Goal
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Developer toggle (temporary) — shows the resolution/selection trace + AI-stage
                        validation next to the generated activities. */}
                    <label className='flex items-center gap-2 pt-4 mt-5 text-sm border-t border-gray-200 text-slate-600'>
                        <input
                            type='checkbox'
                            checked={debugToggle}
                            onChange={(e) => setDebugToggle(e.target.checked)}
                            className='w-4 h-4'
                        />
                        Show debug trace (developer — exposes routing/selection + validation)
                    </label>
                    {/* Action Buttons */}
                    <div className='flex flex-col gap-3 pt-4 mt-5 border-t border-gray-200 sm:flex-row sm:gap-4 sm:mt-10 sm:pt-6'>
                        <Button
                            // Wrapped: the button hands its click event to the first argument, which
                            // would arrive as the generation override.
                            onClick={() => generateActivities()}
                            disabled={!selectedChallengeLevel || !selectedDuration || selectedLearningGoals?.length < 1}
                            className='flex-1 w-full px-6 py-3 text-base font-semibold text-white transition-colors shadow-lg bg-brand rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            Generate Activities
                        </Button>
                    </div>
                </div>
            )}
            {generationStatus === 'selection' && (
                <div className='w-full max-w-sm pt-10 mx-auto sm:max-w-lg md:max-w-2xl lg:max-w-4xl '>
                    {/* Compact Header */}
                    <div className='flex flex-col items-center px-3 py-1 mb-2 text-center first-letter:sm:mb-6 sm:p-6'>
                        <h2 className='px-2 mb-2 text-xl font-bold text-gray-900 sm:text-2xl'>Choose Your Activity</h2>
                        <div className='flex flex-col self-center gap-0 text-sm text-gray-600 sm:flex-row sm:text-base gap-x-2'><p className=''>
                            {generatedActivities.length} activities generated</p><p className='hidden sm:block'>•</p><p className='text-xs text-gray-400 sm:text-gray-600 sm:text-base'>Select the best fit for your session
                        </p>
                        </div>
                        {generationError && (
                            <div className='px-4 py-3 mt-4 text-sm border rounded-xl border-amber-200 bg-amber-50 text-amber-800'>
                                {generationError}
                            </div>
                        )}

                        {/*
                          Shown only when the engine read the goal broadly rather than precisely.
                          A confident match renders nothing here — the activities speak for
                          themselves, and a banner on every success would be noise.
                        */}
                        {resolutionNotice && (
                            <div className='px-4 py-3 mt-4 text-sm text-left border rounded-xl border-slate-200 bg-slate-50 text-slate-700'>
                                <p>{resolutionNotice.message}</p>
                                {resolutionNotice.suggestions?.length > 0 && (
                                    <p className='mt-2 text-slate-500'>
                                        For example: {resolutionNotice.suggestions.join(' · ')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {generatedActivities.length > 0 && (
                        <div className='space-y-1'>
                            {/* Compact Navigation and Activity Card */}
                            <div className='relative'>
                                {/* Activity Card */}
                                <GeneratedActivityCard
                                    activity={generatedActivities[currentActivityIndex]}
                                    allActivities={generatedActivities}
                                    onClick={() =>
                                        selectActivity(
                                            generatedActivities[currentActivityIndex],
                                            selectedChallengeLevel,
                                            selectedDuration,
                                            selectedLearningGoals
                                        )
                                    }
                                    isSelectable={true}
                                    nextActivity={nextActivity}
                                    prevActivity={prevActivity}
                                />
                            </div>

                            {/* Compact Navigation Indicators */}
                            {generatedActivities.length > 1 && (
                                <div className='flex items-center justify-center py-2 mx-2 space-x-2 rounded-lg sm:space-x-4 sm:py-3'>
                                    <div className='flex items-center space-x-2'>
                                        {generatedActivities.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentActivityIndex(index)}
                                                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                                    index === currentActivityIndex
                                                        ? 'bg-brand-600 scale-150'
                                                        : 'bg-gray-300 hover:bg-gray-400'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            {/* Tertiary Action: Return to Dashboard */}
            <div
                className='flex items-center self-center gap-2 mt-2 text-sm text-gray-400 transition-colors cursor-pointer hover:text-gray-700'
                onClick={() => navigate(`/session/${id}`)}
            >
                <ArrowLeftCircleIcon className='w-4' />
                <p className='font-normal'>Return to Session</p>
            </div>
        </div>
    )
}

function splitSentences(text?: string): string[] {
    return (
        text
            ?.split(/(?<=[.!?])\s+|\n+/)
            .map((sentence) => sentence.trim())
            .filter(Boolean) ?? []
    )
}

function summarizeText(text?: string, maxLength = 170): string {
    const firstSentence = splitSentences(text)[0] ?? text?.trim() ?? ''

    if (firstSentence.length <= maxLength) {
        return firstSentence
    }

    return `${firstSentence.slice(0, maxLength).trim()}...`
}

function normalizeLine(line: string): string {
    return line.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Lines that are genuinely DISTINCTIVE to `thisLines` — i.e. NOT present in every one of the
 * sibling activities. This is what makes "Key Rule/Scoring Differences" actually show
 * differences: the shared exchange rule, archetype mechanics, and base scoring (which appear
 * in all three activities) are filtered out, leaving the per-slot value-landscape modifier
 * and any other content unique to this activity. Returns EMPTY when an activity has no
 * distinctive content in this field (e.g. its modifier lives in the other field, or it's a
 * shared-baseline slot) — the caller hides the section rather than label shared boilerplate
 * as a "difference".
 */
function distinctiveLines(thisLines: string[], siblingLineSets: string[][], max: number): string[] {
    if (siblingLineSets.length <= 1) return thisLines.slice(0, max)
    const siblingSets = siblingLineSets.map((lines) => new Set(lines.map(normalizeLine)))
    const distinctive = thisLines.filter((line) => {
        const n = normalizeLine(line)
        // distinctive = not present in EVERY sibling activity
        return !siblingSets.every((set) => set.has(n))
    })
    return distinctive.slice(0, max)
}

function GeneratedActivityCard({
    activity,
    allActivities,
    onClick,
    isSelectable,
    nextActivity,
    prevActivity,
}: {
    activity: IActivity
    allActivities: IActivity[]
    onClick: () => void
    isSelectable: boolean
    nextActivity: () => void
    prevActivity: () => void
}) {
    const [showFullDetails, setShowFullDetails] = useState(false)
    const learningGoals = activity.learningPriorities?.map((goal) => goal.description).filter(Boolean) ?? []
    const setupSummary = summarizeText(activity.setup)

    // "Key differences" = content unique to this activity vs the other generated options, so the
    // coach can actually tell the three apart from the collapsed card. The shared exchange rule /
    // archetype mechanics / base scoring are filtered out as not-a-difference.
    const keyRules = distinctiveLines(
        activity.rules ?? [],
        allActivities.map((a) => a.rules ?? []),
        2
    )
    const keyScoringLines = distinctiveLines(
        splitSentences(activity.scoringSystem),
        allActivities.map((a) => splitSentences(a.scoringSystem)),
        2
    )

    return (
        <div className='relative grid grid-cols-10 px-1 sm:px-0'>
            {/* Left Arrow - Hidden on small screens */}
            <div className='items-center justify-center hidden sm:flex' onClick={() => prevActivity()}>
                <div className='p-1 border rounded-full shadow-md cursor-pointer sm:p-2 hover:shadow-lg hover:bg-brand-50/50 hover:scale-105'>
                    <ChevronLeftIcon className='w-5 h-5 text-brand-400' />
                </div>
            </div>

            {/* Main content - Full width on small screens, 8/10 on larger screens */}
            <div
                className={`rounded-xl overflow-hidden transition-all duration-300 col-span-10 sm:col-span-8 hover:shadow-xl border border-brand-200 p-3 ${
                    isSelectable ? 'cursor-pointer hover:border-brand-300' : ''
                }`}
                ref={(el) => {
                    if (el) {
                        // Initialize event listeners only once
                        if (!el.getAttribute('data-swipe-initialized')) {
                            let startX = 0

                            // For touch devices
                            el.addEventListener(
                                'touchstart',
                                (e) => {
                                    startX = e.touches[0].clientX
                                },
                                { passive: true }
                            )

                            el.addEventListener(
                                'touchend',
                                (e) => {
                                    const endX = e.changedTouches[0].clientX
                                    const deltaX = endX - startX

                                    // Minimum swipe distance threshold (in pixels)
                                    if (Math.abs(deltaX) > 70) {
                                        if (deltaX > 0) {
                                            // Swiped right - go to previous
                                            prevActivity()
                                        } else {
                                            // Swiped left - go to next
                                            nextActivity()
                                        }
                                    }
                                },
                                { passive: true }
                            )

                            // Mark as initialized
                            el.setAttribute('data-swipe-initialized', 'true')
                        }
                    }
                }}
            >
                <div className='py-3 sm:px-6 sm:py-6'>
                    <div className='flex items-start justify-between mb-4'>
                        <h3 className='text-xl font-bold leading-tight text-gray-800'>{activity.title}</h3>
                    </div>

                    <div className='space-y-4 mb-4'>
                        {/* Decision set */}
                        <div>
                            <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Learning Goal / Objective</p>
                            {learningGoals.length > 0 && (
                                <ul className='mb-2 space-y-1'>
                                    {learningGoals.map((goal, i) => (
                                        <li key={i} className='flex items-start gap-2 text-sm text-gray-700'>
                                            <span className='flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500'></span>
                                            {goal}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className='text-sm leading-relaxed text-gray-700'>{activity.intent}</p>
                        </div>

                        {/* Setup — field dimensions, zones, numbers, equipment, restart logic.
                            The AI-written setup description so coaches can physically set up the
                            activity without inventing parameters. */}
                        {setupSummary && (
                            <div className='p-3 rounded-lg bg-blue-50 border border-blue-200'>
                                <p className='text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1'>Setup Summary</p>
                                <p className='text-sm leading-relaxed text-blue-900'>{setupSummary}</p>
                            </div>
                        )}

                        {keyRules.length > 0 && (
                            <div>
                                <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Key Rule Differences</p>
                                <ol className='space-y-1'>
                                    {keyRules.map((rule, i) => (
                                        <li key={i} className='flex gap-2 text-sm text-gray-700'>
                                            <span className='flex-shrink-0 w-4 h-4 mt-0.5 flex items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold'>{i + 1}</span>
                                            <span className='leading-relaxed'>{rule}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {keyScoringLines.length > 0 && (
                            <div className='px-3 py-2 rounded-lg bg-amber-50 border border-amber-200'>
                                <p className='text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1'>Key Scoring Differences</p>
                                {keyScoringLines.map((line, i) => (
                                    <p key={i} className='text-sm leading-relaxed text-amber-800'>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        )}

                        <button
                            type='button'
                            onClick={() => setShowFullDetails((current) => !current)}
                            className='inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900'
                        >
                            {showFullDetails ? (
                                <>
                                    <ChevronUpIcon className='w-4 h-4' />
                                    Hide details
                                </>
                            ) : (
                                <>
                                    <ChevronDownIcon className='w-4 h-4' />
                                    Show full details
                                </>
                            )}
                        </button>

                        {showFullDetails && (
                            <div className='pt-4 mt-4 space-y-4 border-t border-gray-100'>
                                <div>
                                    <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Objective</p>
                                    <p className='text-sm leading-relaxed text-gray-700'>{activity.intent}</p>
                                </div>

                                {activity.setup && (
                                    <div className='p-3 rounded-lg bg-blue-50 border border-blue-200'>
                                        <p className='text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1'>Setup</p>
                                        <p className='text-sm leading-relaxed text-blue-900 whitespace-pre-line'>{activity.setup}</p>
                                    </div>
                                )}

                                {activity.extensions?.[0] && (
                                    <div>
                                        <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Teams</p>
                                        <p className='text-sm leading-relaxed text-gray-700'>{activity.extensions[0]}</p>
                                    </div>
                                )}

                                {activity.rules?.length > 0 && (
                                    <div>
                                        <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Rules</p>
                                        <ol className='space-y-1'>
                                            {activity.rules.map((rule, i) => (
                                                <li key={i} className='flex gap-2 text-sm text-gray-700'>
                                                    <span className='flex-shrink-0 w-4 h-4 mt-0.5 flex items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold'>{i + 1}</span>
                                                    <span className='leading-relaxed'>{rule}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {activity.scoringSystem && (
                                    <div className='px-3 py-2 rounded-lg bg-amber-50 border border-amber-200'>
                                        <p className='text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1'>Scoring</p>
                                        <p className='text-sm leading-relaxed text-amber-800'>{activity.scoringSystem}</p>
                                    </div>
                                )}

                                {activity.winCondition && (
                                    <div>
                                        <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Win Condition</p>
                                        <p className='text-sm leading-relaxed text-gray-700'>{activity.winCondition}</p>
                                    </div>
                                )}

                                <div className='grid grid-cols-2 gap-3'>
                                    <div className='p-3 rounded-lg bg-gray-50'>
                                        <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Group Size</p>
                                        <p className='text-sm text-gray-700'>{activity.playerGroupSizes} players</p>
                                    </div>
                                    <div className='p-3 rounded-lg bg-gray-50'>
                                        <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Equipment</p>
                                        <p className='text-sm text-gray-700'>{activity.equipmentNeeded?.join(', ') || 'None'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={onClick}
                    className='flex flex-col items-center w-full p-4 text-center transition-all duration-200 bg-gradient-to-r from-brand to-brand-600 hover:from-brand-700 hover:to-brand-800 focus:ring-2 focus:ring-brand-400 focus:outline-none sm:rounded-b-xl rounded-xl group'
                    type='button'
                >
                    <span className='flex items-center justify-center text-base font-semibold text-white'>
                        <CheckIcon className='w-5 h-5 mr-2' />
                        Select This Activity
                    </span>
                    <span className='mt-1 text-xs transition-colors text-brand-100 group-hover:text-white'>
                        Click to start this activity in your session
                    </span>
                </button>
            </div>

            {/* Right Arrow - Hidden on small screens */}
            <div className='items-center justify-center hidden sm:flex' onClick={() => nextActivity()}>
                <div className='p-1 border rounded-full shadow-md cursor-pointer sm:p-2 hover:shadow-lg hover:bg-brand-50/50 hover:scale-105'>
                    <ChevronRightIcon className='w-5 h-5 text-brand-400' />
                </div>
            </div>

            {/* Small screen swipe indicator */}
            <div className='col-span-10 mt-2 text-xs text-center text-gray-400 sm:hidden'>
                Swipe left or right to navigate activities
            </div>

            
        </div>
    )
}
