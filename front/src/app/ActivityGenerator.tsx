import {
    ArrowLeftCircleIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
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

// Create options array from ChallengeLevels enum
const challengeLevelOptions = Object.entries(ChallengeLevels).map(([text, value]) => ({
    value,
    text,
}))

export default function ActivityGenerator() {
    const { id } = useParams()
    type GenerationStatus = 'creation' | 'generation' | 'selection'
    const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('creation')
    const [generationError, setGenerationError] = useState<string | null>(null)
    const [selectedChallengeLevel, setSelectedChallengeLevel] = useState<ChallengeLevels>()
    const [selectedDuration, setSelectedDuration] = useState<number>()
    const [selectedLearningGoals, setSelectedLearningGoals] = useState<string[]>([])
    const [generatedActivities, setGeneratedActivities] = useState<IActivity[]>([])
    const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
    const navigate = useNavigate()

    const buildGenerationErrorMessage = (errorResponse?: { error?: string; message?: string; stage?: string; details?: string[] }) => {
        if (!errorResponse) {
            return 'Unable to generate activities right now. Please review your inputs and try again.'
        }

        const messageParts = [errorResponse.error ?? errorResponse.message]
        if (errorResponse.stage && errorResponse.error && !errorResponse.error.startsWith(`${errorResponse.stage}:`)) {
            messageParts[0] = `${errorResponse.stage}: ${errorResponse.error}`
        }

        if (Array.isArray(errorResponse.details) && errorResponse.details.length > 0) {
            messageParts.push(errorResponse.details[0])
        }

        return messageParts.filter(Boolean).join(' ') || 'Unable to generate activities right now. Please review your inputs and try again.'
    }

    const resetGenerationState = (message?: string) => {
        setGeneratedActivities([])
        setCurrentActivityIndex(0)
        setGenerationStatus('creation')
        setGenerationError(message ?? 'Unable to generate activities right now. Please review your inputs and try again.')
    }

    const generateActivities = async () => {
        if (!selectedChallengeLevel || !selectedDuration) {
            return
        }

        setGenerationError(null)
        setGenerationStatus('generation')

        try {
            const res = await api<IActivity[]>(`${ROUTES.app.generateActivities}/${id}`, {
                challengeLevel: selectedChallengeLevel,
                duration: selectedDuration,
                learningGoals: selectedLearningGoals,
            })

            if (res.error || !Array.isArray(res.data)) {
                resetGenerationState(buildGenerationErrorMessage(res))
                return
            }

            setCurrentActivityIndex(0)
            setGeneratedActivities(res.data)
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
        api<{ data: IActivity }>(`${ROUTES.app.activity}`, {
            ...selectedActivity,
            _id: 'new',
            activityStatus: ActivityStatus['Ready to Start'],
            session: id,
            challengeLevel,
            duration,
            learningPriorities: learningGoals.map((lg) => ({description: lg, achieved: false})),
        }).then((res) => {
            navigate(`/activity/${res.data.data._id}`)
            api(ROUTES.app.session, { _id: id, sessionStatus: SessionStatus['In Progress'] })
        })
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
            {generationStatus === 'creation' && (
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
                                {generationError}
                            </div>
                        )}

                        {/* Challenge Level */}
                        <div>
                            <SelectField
                                label='Challenge Level'
                                value={selectedChallengeLevel || ''}
                                onChange={(value) => setSelectedChallengeLevel(value as ChallengeLevels)}
                                options={challengeLevelOptions}
                                placeholder='Select challenge level for this activity'
                                labelClass='text-gray-700 font-medium mb-2 block'
                                inputClass='text-base'
                                className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                            />
                            <p className='mt-2 text-sm text-gray-500'>
                                Choose based on your players' current skill level and development goals
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
                                Add specific objectives you want players to achieve during this activity
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
                    {/* Action Buttons */}
                    <div className='flex flex-col gap-3 pt-4 mt-5 border-t border-gray-200 sm:flex-row sm:gap-4 sm:mt-10 sm:pt-6'>
                        <Button
                            onClick={generateActivities}
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
                    </div>

                    {generatedActivities.length > 0 && (
                        <div className='space-y-1'>
                            {/* Compact Navigation and Activity Card */}
                            <div className='relative'>
                                {/* Activity Card */}
                                <GeneratedActivityCard
                                    activity={generatedActivities[currentActivityIndex]}
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

function GeneratedActivityCard({
    activity,
    onClick,
    isSelectable,
    nextActivity,
    prevActivity,
}: {
    activity: IActivity
    onClick: () => void
    isSelectable: boolean
    nextActivity: () => void
    prevActivity: () => void
}) {
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

                    <div className='mb-6'>
                        <p className='text-sm leading-relaxed text-gray-700 sm:text-base max-h-[40vh] overflow-scroll'>
                            Constraint: {activity.constraint}
                        </p>
                        <p className='text-sm leading-relaxed text-gray-700 sm:text-base max-h-[40vh] overflow-scroll'>
                            Intent: {activity.intent}
                        </p>
                    </div>

                    <div className='grid gap-4 mb-6 sm:grid-cols-2'>
                        <div className='px-4 py-2 border border-blue-200 rounded-lg sm:py-4 bg-blue-50'>
                            <div className='flex items-center mb-2'>
                                <svg className='w-4 h-4 mr-2 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                                    <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z' />
                                </svg>
                                <h4 className='text-sm font-semibold text-blue-800'>Group Sizes</h4>
                            </div>
                            <p className='text-sm font-medium text-blue-700 sm:text-base'>{activity.playerGroupSizes}</p>
                        </div>

                        <div className='px-4 py-2 border rounded-lg border-brand-200 sm:py-2 bg-brand-50'>
                            <div className='flex items-center mb-2'>
                                <svg className='w-4 h-4 mr-2 text-brand-600' fill='currentColor' viewBox='0 0 20 20'>
                                    <path
                                        fillRule='evenodd'
                                        d='M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                                <h4 className='text-sm font-semibold text-brand-800'>Equipment</h4>
                            </div>
                            <p className='text-sm font-medium text-brand-700 line-clamp-2 sm:text-base'>
                                {activity.equipmentNeeded?.length > 0
                                    ? activity.equipmentNeeded.join(', ')
                                    : 'None required'}
                            </p>
                        </div>
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
