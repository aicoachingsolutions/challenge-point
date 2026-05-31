import {
    ArrowLeftCircleIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ClipboardDocumentIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrayFieldWrapper } from '@/form-control'
import { NumberField, SliderField, TextField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { ActivityStatus, DifficultyLevels, EngagementLevels, IActivity, IPointsScored } from '@/MODELS/activity.model'

import { api } from '@/services/api.service'
import { useResource } from '@/services/resource.service'
import { determineZpdZone, getZoneInfo } from '@/utils/analysis'

import Button from '@/components/Button'
import Loading from '@/components/Loading'
import Modal from '@/components/Modal'
import ActivityReviewForm from '@/forms/ActivityReviewForm'

// Create options array from EngagementLevels enum
export const engagementLevelOptions = Object.entries(EngagementLevels).map(([text, value]) => ({
    value,
    text,
}))

// Create options array from DifficultyLevels enum
export const difficultyLevelOptions = Object.entries(DifficultyLevels).map(([text, value]) => ({
    value,
    text,
}))

export default function ActivityPage() {
    const { id } = useParams()
    const [activity, setActivity, activityResource] = useResource<IActivity>(`${ROUTES.app.activity}/${id}`)
    const [recommendedActivityModalOpen, setRecommendedActivityModalOpen] = useState(false)
    const navigate = useNavigate()

    const updateActivityStatus = async (updatedStatus: ActivityStatus) => {
        if (!id) {
            console.error('Missing activity id/session id for Start Activity')
            throw new Error('Missing activity id/session id for Start Activity')
        }

        const res = await api(ROUTES.app.activity, { _id: id, activityStatus: updatedStatus })
        console.log('Start Activity status update response', {
            endpoint: ROUTES.app.activity,
            payload: { _id: id, activityStatus: updatedStatus },
            status: res.status,
            body: res.data,
            error: res.error,
        })
        if (res.error) {
            throw new Error(res.error)
        }
        setActivity((current) => (current ? { ...current, activityStatus: updatedStatus } : current))
        await activityResource.get()
    }

    return (
        <div className='flex flex-col gap-5 px-2 py-6'>
            <h2 className='pb-2 mb-5 text-xl font-semibold text-gray-800 border-b border-gray-200'>{activity?.title}</h2>

            {(activity?.activityStatus === ActivityStatus['In Progress'] ||
                activity?.activityStatus === ActivityStatus['Ready to Start']) && (
                <ActivityScreen activity={activity} updateActivityStatus={updateActivityStatus} />
            )}

            {activity?.activityStatus === ActivityStatus['Review'] && (
                <ActivityReviewForm id={id} updateActivityStatus={updateActivityStatus} />
            )}

            {activity?.activityStatus === ActivityStatus['Completed'] && (
                <div className='space-y-6'>
                    {/* Success Banner */}
                    <div className='p-6 text-center text-white rounded-lg bg-gradient-to-r from-green-500 to-emerald-600'>
                        <div className='mb-4'>
                            <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white rounded-full bg-opacity-20'>
                                <CheckIcon className='w-8 h-8 text-white' />
                            </div>
                            <h2 className='mb-2 text-2xl font-bold'>Activity Completed!</h2>
                            <p className='text-green-100'>
                                Great work! Your activity feedback has been recorded and saved.
                            </p>
                        </div>
                    </div>

                    {/* Results Summary */}
                    <div className='bg-white border rounded-lg shadow-sm'>
                        <div className='p-6'>
                            <h3 className='mb-4 text-lg font-semibold text-gray-800'>Activity Summary</h3>

                            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                                <div className='p-4 border border-blue-200 rounded-lg bg-blue-50'>
                                    <div className='flex items-center space-x-3'>
                                        <div
                                            className={`w-4 h-4 rounded-full ${activity.breakthroughMoments ? 'bg-blue-500' : 'bg-gray-300'}`}
                                        ></div>
                                        <div>
                                            <p className='font-semibold text-gray-800'>Breakthrough Moment</p>
                                            <p className='text-sm text-gray-600'>
                                                {activity.breakthroughMoments
                                                    ? `Yes - ${activity.breakthroughMoments} players had breakthrough moments!`
                                                    : 'No breakthrough moments observed'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className='p-4 border border-green-200 rounded-lg bg-green-50'>
                                    <div className='flex items-center space-x-3'>
                                        <div
                                            className={`w-4 h-4 rounded-full ${activity.learningPriorities?.filter((lp) => lp.achieved)?.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                                        ></div>
                                        <div>
                                            <p className='font-semibold text-gray-800'>Learning Goals</p>
                                            <p className='text-sm text-gray-600'>
                                                {activity.learningPriorities?.filter((lp) => lp.achieved)?.length > 0
                                                    ? `${activity.learningPriorities?.filter((lp) => lp.achieved)?.length} goals successfully achieved`
                                                    : 'No goals achieved yet'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ZPD Zone Visualization - Takes full width */}
                    <div className='p-4 my-3 bg-white rounded shadow-sm'>
                        <h3 className='mb-2 font-semibold'>Learning Zone Assessment</h3>

                        {/* Calculate zone */}
                        {(() => {
                            const zoneNumber = determineZpdZone(
                                activity.difficultyLevel || DifficultyLevels.Medium,
                                activity.engagementLevel || EngagementLevels.Medium
                            )
                            const zoneInfo = getZoneInfo(zoneNumber)

                            return (
                                <>
                                    {/* ZPD Zone Visualization */}
                                    <div className='mb-3'>
                                        <div className='flex h-6 mb-2 overflow-hidden rounded-full'>
                                            {/* Zone gradient bar */}
                                            <div
                                                className='w-1/5 bg-gray-300'
                                                style={{ backgroundColor: '#D3D3D3' }}
                                            ></div>
                                            <div
                                                className='w-1/5 bg-blue-200'
                                                style={{ backgroundColor: '#ADD8E6' }}
                                            ></div>
                                            <div
                                                className='w-1/5 bg-blue-400'
                                                style={{ backgroundColor: '#00BFFF' }}
                                            ></div>
                                            <div
                                                className='w-1/5 bg-orange-400'
                                                style={{ backgroundColor: '#FFA500' }}
                                            ></div>
                                            <div
                                                className='w-1/5 bg-red-500'
                                                style={{ backgroundColor: '#DC143C' }}
                                            ></div>
                                        </div>

                                        {/* Zone indicator */}
                                        <div className='relative h-0'>
                                            <div
                                                className='absolute w-4 h-4 transform -translate-x-1/2 border-2 border-white rounded-full shadow-md'
                                                style={{
                                                    backgroundColor: zoneInfo.color,
                                                    left: `${(zoneNumber - 0.5) * 20}%`,
                                                    top: '-10px',
                                                }}
                                            ></div>
                                        </div>

                                        {/* Zone labels */}
                                        <div className='flex justify-between text-xs text-gray-600'>
                                            <span>Far Too Easy</span>
                                            <span className='text-[#00BFFF] font-semibold'>Optimal Learning Zone</span>
                                            <span>Far Too Hard</span>
                                        </div>
                                    </div>

                                    {/* Zone information */}
                                    <div
                                        className='p-3 mt-2 rounded-md'
                                        style={{ backgroundColor: `${zoneInfo.color}20` }}
                                    >
                                        <div className='flex items-center gap-2'>
                                            <div
                                                className='w-4 h-4 rounded-full'
                                                style={{ backgroundColor: zoneInfo.color }}
                                            ></div>
                                            <h4 className='font-semibold'>{zoneInfo.name}</h4>
                                        </div>
                                        <p className='mt-1 text-sm'>{zoneInfo.description}</p>
                                    </div>
                                </>
                            )
                        })()}
                    </div>

                    <div className='p-3 my-3 bg-white rounded shadow-sm'>
                        <p className='font-semibold'>Coach comments:</p>
                        <p>{activity.coachComments || 'No comments provided'}</p>
                    </div>

                    {/* Next Steps */}
                    <div className='bg-white border rounded-lg shadow-sm'>
                        <div className='p-6 text-center'>
                            <h3 className='mb-4 text-lg font-semibold text-gray-800'>What's Next?</h3>
                            <div className='space-y-4'>
                                <Button
                                    onClick={() => navigate(`/session/${activity.session._id}`)}
                                    className='w-full max-w-md px-6 py-3 mx-auto text-base font-semibold '
                                >
                                    <ClipboardDocumentIcon className='w-5 mr-2' />
                                    Create Another Activity
                                </Button>
                                <p className='text-sm text-gray-600'>
                                    Continue building your session by adding more activities, or mark the session as
                                    complete.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div
                className='flex items-center self-center gap-2 mt-5 text-sm text-gray-400 hover:text-gray-600'
                onClick={() => navigate(`/session/${activity.session._id}`)}
            >
                <ArrowLeftCircleIcon className='w-5 ' />
                <p className=''>Return to Session page</p>
            </div>
        </div>
    )
}

function ActivityScreen({
    activity,
    updateActivityStatus,
}: {
    activity: IActivity
    updateActivityStatus: (updatedStatus: ActivityStatus) => Promise<void>
}) {
    const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevels>(DifficultyLevels['Medium'])
    const [engagementLevel, setEngagementLevel] = useState<EngagementLevels>(EngagementLevels['Medium'])
    const [pointsTracking, setPointsTracking] = useState<IPointsScored[]>([])
    const [isUpdating, setIsUpdating] = useState(false)
    const [startError, setStartError] = useState<string | null>(null)
    const [showLiveActivityDetails, setShowLiveActivityDetails] = useState(false)

    const [showScaffolding, setShowScaffolding] = useState(false)
    const [showExtensions, setShowExtensions] = useState(false)
    const navigate = useNavigate()
    const isInProgress = activity.activityStatus === ActivityStatus['In Progress']
    const activityDetailsExpanded = !isInProgress || showLiveActivityDetails

    const startActivity = async () => {
        const activityId = activity._id
        const sessionId = typeof activity.session === 'string' ? activity.session : activity.session?._id
        const destinationRoute = activityId ? `/activity/${activityId}` : '/activity/{missing}'
        console.log('Start Activity clicked', {
            activityId,
            sessionId,
            currentStatus: activity.activityStatus,
            destinationRoute,
        })

        if (!activityId || !sessionId) {
            console.error('Missing activity id/session id for Start Activity')
            setStartError('Missing activity id/session id for Start Activity')
            return
        }

        try {
            setStartError(null)
            await updateActivityStatus(ActivityStatus['In Progress'])
            navigate(`/activity/${activityId}`)
            window.scrollTo(0, 0)
        } catch (error) {
            console.error('Failed to start activity', error)
            setStartError(error instanceof Error ? error.message : 'Failed to start activity')
        }
    }

    const updateLevels = async () => {
        setIsUpdating(true)
        await api(ROUTES.app.activity, { _id: activity._id, difficultyLevel, engagementLevel, pointsTracking })
        setIsUpdating(false)
        return 'updated'
    }

    const endActivity = async () => {
        await updateLevels()
        await updateActivityStatus(ActivityStatus['Review'])
         window.scrollTo(0, 0)
    }

    return (
        <div className='flex flex-col gap-6'>
            {/* Activity Status Banner */}
            <div
                className={`relative order-1 overflow-hidden rounded-lg ${
                    activity.activityStatus === ActivityStatus['In Progress']
                        ? 'bg-gradient-to-r from-green-500 to-blue-600'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                }`}
            >
                <div className='px-6 py-4 text-white'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                            <div className='flex space-x-1'>
                                {activity.activityStatus === ActivityStatus['In Progress'] ? (
                                    <>
                                        <div className='w-2 h-2 bg-white rounded-full animate-pulse'></div>
                                        <div
                                            className='w-2 h-2 bg-white rounded-full animate-pulse'
                                            style={{ animationDelay: '0.2s' }}
                                        ></div>
                                        <div
                                            className='w-2 h-2 bg-white rounded-full animate-pulse'
                                            style={{ animationDelay: '0.4s' }}
                                        ></div>
                                    </>
                                ) : (
                                    <div className='flex items-center justify-center w-5 h-5 rounded-full cursor-pointer bg-brand-500'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='w-3 h-3 text-indigo-800'
                                            viewBox='0 0 20 20'
                                            fill='currentColor'
                                        >
                                            <path
                                                fillRule='evenodd'
                                                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                                clipRule='evenodd'
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <h2 className='text-xl font-bold'>
                                {activity.activityStatus === ActivityStatus['In Progress']
                                    ? 'Activity in Progress'
                                    : 'Ready to Start'}
                            </h2>
                        </div>
                        <div
                            className={`hidden sm:block px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                                activity.activityStatus === ActivityStatus['In Progress']
                                    ? 'bg-white bg-opacity-20'
                                    : 'bg-indigo-800 bg-opacity-30'
                            }`}
                        >
                            {activity.activityStatus === ActivityStatus['In Progress'] ? 'Live Session' : 'Start Now'}
                        </div>
                    </div>
                    <p
                        className={`mt-2 ${
                            activity.activityStatus === ActivityStatus['In Progress']
                                ? 'text-green-100'
                                : 'text-purple-100'
                        }`}
                    >
                        {activity.activityStatus === ActivityStatus['In Progress']
                            ? 'Monitor and adjust difficulty as players engage with the activity'
                            : 'Introduce the activity to your players and explain the rules'}
                    </p>
                </div>
                {/* Animated background effect - different for each status */}
                {activity.activityStatus === ActivityStatus['In Progress'] ? (
                    <div className='absolute top-0 left-0 w-full h-full bg-white opacity-5 animate-pulse'></div>
                ) : (
                    <div
                        className='absolute top-0 left-0 w-full h-full cursor-pointer'
                        onClick={startActivity}
                    >
                        <div className='absolute w-12 h-12 bg-white rounded-full top-1/4 right-1/4 opacity-10'></div>
                        <div className='absolute w-8 h-8 bg-white rounded-full bottom-1/3 left-1/3 opacity-10'></div>
                    </div>
                )}
            </div>

            {/* Activity Details Card */}
            <div className={`bg-white border rounded-lg shadow-sm ${isInProgress ? 'order-5' : 'order-2'}`}>
                <div className='p-6'>
                    <div className='flex items-center justify-between gap-4 mb-5'>
                        <h3 className='text-lg font-semibold text-gray-800'>Activity Details</h3>
                        {isInProgress && (
                            <button
                                type='button'
                                onClick={() => setShowLiveActivityDetails((current) => !current)}
                                className='inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900'
                            >
                                {activityDetailsExpanded ? (
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
                        )}
                    </div>
                    {activityDetailsExpanded && (
                        <div className='space-y-5'>

                        {/* Objective */}
                        <div>
                            <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Objective</p>
                            <p className='leading-relaxed text-gray-700'>{activity?.intent}</p>
                        </div>

                        {/* Setup — field dimensions, zones, numbers, equipment, restart logic.
                            Surfaces the AI-written setup description so coaches can physically
                            set up the activity without inventing parameters. */}
                        {activity?.setup && (
                            <div className='p-4 rounded-lg bg-blue-50 border border-blue-200'>
                                <p className='text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1'>Setup</p>
                                <p className='text-sm leading-relaxed text-blue-900 whitespace-pre-line'>{activity.setup}</p>
                            </div>
                        )}

                        {/* Teams */}
                        {activity?.extensions?.[0] && (
                            <div>
                                <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Teams</p>
                                <p className='leading-relaxed text-gray-700'>{activity.extensions[0]}</p>
                            </div>
                        )}

                        {/* Rules */}
                        {activity?.rules?.length > 0 && (
                            <div>
                                <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2'>Rules</p>
                                <ol className='space-y-2'>
                                    {activity.rules.map((r, i) => (
                                        <li key={i} className='flex gap-3 text-sm text-gray-700'>
                                            <span className='flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold mt-0.5'>{i + 1}</span>
                                            <span className='leading-relaxed'>{r}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* Scoring */}
                        {activity?.scoringSystem && (
                            <div className='p-4 rounded-lg bg-amber-50 border border-amber-200'>
                                <p className='text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1'>Scoring</p>
                                <p className='text-sm leading-relaxed text-amber-800'>{activity.scoringSystem}</p>
                            </div>
                        )}

                        {/* Win Condition */}
                        {activity?.winCondition && (
                            <div>
                                <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Win Condition</p>
                                <p className='text-sm leading-relaxed text-gray-700'>{activity.winCondition}</p>
                            </div>
                        )}

                        {/* Setup info */}
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='p-3 rounded-lg bg-gray-50'>
                                <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Group Size</p>
                                <p className='text-sm text-gray-700'>{activity?.playerGroupSizes} players</p>
                            </div>
                            <div className='p-3 rounded-lg bg-gray-50'>
                                <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>Equipment</p>
                                <p className='text-sm text-gray-700'>{activity?.equipmentNeeded?.join(', ') || 'None'}</p>
                            </div>
                        </div>

                        {/* Learning Goals */}
                        {activity?.learningPriorities && activity.learningPriorities.length > 0 && (
                            <div className='p-4 rounded-lg bg-blue-50 border border-blue-200'>
                                <p className='text-xs font-semibold uppercase tracking-wide text-blue-600 mb-2'>Learning Goals</p>
                                <ul className='space-y-1'>
                                    {activity.learningPriorities.map((goal, index) => (
                                        <li key={index} className='flex items-start gap-2 text-sm text-blue-800'>
                                            <span className='flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500'></span>
                                            {goal.description}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        </div>
                    )}
                </div>
            </div>

            {/* Live Session — observation surface. Deliberately OUTSIDE the collapsible
                Activity Details card: "what to pay attention to" must always be visible while
                the activity is live, regardless of whether the reference details are expanded.
                order-2 places it directly under the status banner, above the live tools (Points
                / Adjustments) and the collapsed-by-default Activity Details reference card.
                Shown only In Progress per Christian's three-surface information architecture. */}
            {isInProgress && (
                <div className='flex flex-col order-2 gap-6'>
                    {/* Coaching Focus */}
                    {activity?.scaffolding?.length > 0 && (
                        <div className='p-4 rounded-lg bg-green-50 border border-green-200'>
                            <p className='text-xs font-semibold uppercase tracking-wide text-green-600 mb-2'>Coaching Focus</p>
                            <ul className='space-y-1'>
                                {activity.scaffolding.map((cue, i) => (
                                    <li key={i} className='flex items-start gap-2 text-sm text-green-800'>
                                        <span className='flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500'></span>
                                        {cue}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* What to Watch — placeholder for the future observation layer.
                        Non-functional by design (Christian's MVP2 request): reserves the
                        information-architecture home for observation support. No data binding. */}
                    <div className='p-4 rounded-lg bg-gray-50 border border-dashed border-gray-300'>
                        <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2'>What to Watch</p>
                        <p className='text-sm italic leading-relaxed text-gray-400'>
                            Interaction signals and observation guidance will appear here in a future update.
                        </p>
                    </div>
                </div>
            )}

            {activity.activityStatus === ActivityStatus['Ready to Start'] && (
                <div className='flex flex-col order-3 gap-2 py-5'>
                    <Button
                        className='w-full max-w-sm rounded-full sm:self-center'
                        onClickAsync={startActivity}
                    >
                        Start Activity
                    </Button>
                    <p className='text-xs text-center text-gray-600'>
                        Ready to start? Tap to get started and enable real-time adjustments and points
                        tracking.
                    </p>
                    {startError && <p className='text-sm text-center text-amber-600'>{startError}</p>}
                </div>
            )}

            {isInProgress && (
                <>
                    {/* Start Session control: no in-progress start control exists; the Ready to Start button disappears after starting. */}
                    {/* Timer / Stopwatch placeholder: no timer/stopwatch component or import exists in this file. */}
                </>
            )}

            <div className='relative flex flex-col order-4 gap-6'>
                {/* Frosted overlay - only shown when activity is not in progress */}
                {activity.activityStatus === ActivityStatus['Ready to Start'] && (
                    <div className='absolute inset-0 z-20 flex flex-col items-center justify-center bg-white rounded-lg bg-opacity-70 backdrop-blur-sm'>
                        <div className='p-6 text-center'>
                            <h3 className='mb-2 text-lg font-medium text-gray-700'>Controls Unavailable</h3>
                            <p className='text-sm text-gray-500'>
                                Start the activity to enable real-time adjustments and points tracking
                            </p>
                        </div>
                    </div>
                )}
                {/* Real-time Adjustment Controls */}
                <div className={`bg-white border rounded-lg shadow-sm ${isInProgress ? 'order-2' : 'order-1'}`}>
                    <div className='p-6'>
                        <h3 className='mb-4 text-lg font-semibold text-gray-800'>Real-time Adjustments</h3>
                        <p className='mb-6 text-sm text-gray-600'>
                            Adjust these settings based on how players are responding to the activity
                        </p>

                        <div className='space-y-10'>
                            <div className='space-y-3'>
                                <SliderField
                                    value={difficultyLevel}
                                    onChange={(v: DifficultyLevels) => setDifficultyLevel(v)}
                                    options={difficultyLevelOptions}
                                    label='How difficult are players finding the task?'
                                    labelClass='font-medium text-gray-700 mb-1 block'
                                />
                                {difficultyLevel === DifficultyLevels['High'] && (
                                    <div className='p-4 mt-4 border border-red-200 rounded-lg bg-red-50'>
                                        <div className='flex items-center justify-between gap-5 sm:justify-normal'>
                                            <p className='text-sm font-medium text-red-700'>Too difficult?</p>
                                            <Button.Outline
                                                onClick={() => setShowScaffolding(true)}
                                                className='text-sm text-red-700 bg-transparent rounded-full hover:text-white hover:bg-red-700'
                                            >
                                                Show Scaffolding
                                            </Button.Outline>
                                        </div>

                                        {showScaffolding && (
                                            <div className='p-3 mt-3 text-sm bg-white border rounded-lg'>
                                                <h3 className='mb-3 font-semibold text-red-700'>Scaffolding Options</h3>
                                                <ul className='pl-5 space-y-2 text-red-700 list-disc'>
                                                    {activity.scaffolding?.map((s, index) => <li key={index}>{s}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {difficultyLevel === DifficultyLevels['Medium'] && (
                                    <div className='p-4 mt-4 border rounded-lg border-electric-200 bg-electric-50/50'>
                                        <div className='flex items-center justify-between gap-5 sm:justify-normal'>
                                            <p className='text-sm font-medium text-electric-500'>
                                                Optimal difficulty level
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {difficultyLevel === DifficultyLevels['Low'] && (
                                    <div className='p-4 mt-4 border border-gray-200 rounded-lg bg-gray-50'>
                                        <div className='flex items-center justify-between gap-5 sm:justify-normal'>
                                            <p className='text-sm font-medium text-gray-700'>Finding this too easy?</p>
                                            <Button.Outline
                                                onClick={() => setShowExtensions(true)}
                                                className='text-sm text-gray-700 bg-transparent rounded-full hover:text-white hover:bg-gray-700'
                                            >
                                                Show Extensions
                                            </Button.Outline>
                                        </div>

                                        {showExtensions && (
                                            <div className='p-3 mt-3 text-sm bg-white border rounded-lg'>
                                                <h3 className='mb-2 font-semibold text-gray-700'>Extension Options</h3>
                                                <ul className='pl-5 space-y-2 text-gray-700 list-disc'>
                                                    {activity.extensions?.map((s, index) => <li key={index}>{s}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className='space-y-3'>
                                <SliderField
                                    value={engagementLevel}
                                    onChange={(v: EngagementLevels) => setEngagementLevel(v)}
                                    options={engagementLevelOptions}
                                    label='How engaged are players in the task?'
                                    labelClass='font-medium text-gray-700'
                                />
                                {engagementLevel === EngagementLevels['Low'] && (
                                    <div className='p-4 mt-4 border border-gray-200 rounded-lg bg-gray-50'>
                                        <div className='flex items-center justify-between gap-5 sm:justify-normal'>
                                            <p className='text-sm font-medium text-gray-500'>
                                                Athletes are not focused or engaged, low energy levels.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {engagementLevel === EngagementLevels['Medium'] && (
                                    <div className='p-4 mt-4 border rounded-lg border-[#CCE7F0] bg-[#ECF6F9]'>
                                        <div className='flex items-center justify-between gap-5 sm:justify-normal'>
                                            <p className='text-sm font-medium text-[#82C4D9]'>
                                                Athletes are somewhat engaged and motivated.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {engagementLevel === EngagementLevels['High'] && (
                                    <div className='p-4 mt-4 border rounded-lg border-electric-200 bg-electric-50/50'>
                                        <div className='flex items-center justify-between gap-5 sm:justify-normal'>
                                            <p className='text-sm font-medium text-electric-500'>
                                                Athletes are fully absorbed & attentive with persistent effort
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`bg-white border rounded-lg shadow-sm ${isInProgress ? 'order-1' : 'order-2'}`}>
                    <div className='p-6'>
                        <h3 className='mb-4 text-lg font-semibold text-gray-800'>Points Tracking (Optional)</h3>
                        <p className='mb-6 text-sm text-gray-600'>
                            Use this section to track points scored by the teams.
                        </p>
                        <div className='space-y-5'>
                            {pointsTracking.map((pointsScored, index) => (
                                <div key={index} className='flex items-center justify-between gap-3'>
                                    <div className='flex flex-col sm:gap-x-5 sm:flex-row'>
                                        <TextField
                                            value={pointsScored.teamName}
                                            onChange={(value) => {
                                                const newPointsTrackingArray = [...pointsTracking]
                                                newPointsTrackingArray[index].teamName = value
                                                setPointsTracking(newPointsTrackingArray)
                                            }}
                                        />
                                        <NumberField
                                            value={pointsScored.points}
                                            onChange={(value) => {
                                                const newPointsTrackingArray = [...pointsTracking]
                                                newPointsTrackingArray[index].points = value
                                                setPointsTracking(newPointsTrackingArray)
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newPointsTrackingArray = pointsTracking.filter((_, i) => i !== index)
                                            setPointsTracking(newPointsTrackingArray)
                                        }}
                                        className='flex items-center justify-center w-10 h-10 mt-1 text-red-600 transition-colors bg-red-100 rounded-xl hover:bg-red-200'
                                    >
                                        <XMarkIcon className='w-5 h-5' />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() =>
                                    setPointsTracking([
                                        ...pointsTracking,
                                        { teamName: `Team ${pointsTracking.length + 1}`, points: 0 },
                                    ])
                                }
                                className='w-full px-6 py-4 text-base text-gray-600 transition-colors border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 hover:border-gray-400'
                            >
                                + Add Team
                            </button>
                        </div>
                    </div>
                </div>

                {/* End Activity Button */}
                <div className='flex flex-col items-center order-3 space-y-4'>
                    <Button onClick={endActivity} disabled={isUpdating}>
                        {isUpdating ? (
                            <div className='flex items-center justify-center'>
                                <div className='w-5 h-5 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin'></div>
                                Saving...
                            </div>
                        ) : (
                            'End Activity & Review'
                        )}
                    </Button>
                    <p className='max-w-md text-sm text-center text-gray-500'>
                        Click to finish this activity and provide detailed feedback about how it went
                    </p>
                </div>
            </div>
        </div>
    )
}
