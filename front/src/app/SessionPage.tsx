import { XMarkIcon } from '@heroicons/react/20/solid'
import {
    ArrowLeftCircleIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClipboardDocumentIcon,
    DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrayFieldWrapper } from '@/form-control'
import { NumberField, SelectField, TextAreaField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { ActivityStatus, ChallengeLevels, DifficultyLevels, IActivity } from '@/MODELS/activity.model'
import { ISession, SessionStatus } from '@/MODELS/session.model'

import { api } from '@/services/api.service'
import { useResource } from '@/services/resource.service'
import { camelCaseToTitleCase } from '@/utils/scary-utils'

import Button from '@/components/Button'
import Loading from '@/components/Loading'
import Modal from '@/components/Modal'

// Create options array from ChallengeLevels enum
const challengeLevelOptions = Object.entries(ChallengeLevels).map(([text, value]) => ({
    value,
    text,
}))

export default function SessionPage() {
    const { id } = useParams()
    const [session, setSession, sessionResource] = useResource<ISession>(`${ROUTES.app.session}/${id}`)
    const [generatingActivities, setGeneratingActivities] = useState(false)

    const [selectedChallengeLevel, setSelectedChallengeLevel] = useState<ChallengeLevels>()
    const [selectedDuration, setSelectedDuration] = useState<number>()
    const [selectedLearningGoals, setSelectedLearningGoals] = useState<string[]>([])

    const [activities, __, activitiesResource] = useResource<IActivity[]>(`${ROUTES.app.activity}/session/${id}`)
    const navigate = useNavigate()

    // Auto-show activity generation modal for new sessions
    useEffect(() => {
        // Wait for both session and activities to load
        if (!sessionResource.isLoading && !activitiesResource.isLoading && session && activities) {
            // If this is a new session with no activities, auto-show the generation modal
            if (activities.length === 0 && session.sessionStatus === SessionStatus['Draft']) {
                navigate('activity-generator')
            }
        }
    }, [sessionResource.isLoading, activitiesResource.isLoading, session, activities])

    const completeSession = async () => {
        api(ROUTES.app.session, { _id: id, sessionStatus: SessionStatus['Completed'] }).then((res) => navigate('/'))
    }

    const duplicateSession = () => {
        api<ISession>(`${ROUTES.app.session}/${id}/duplicate`).then((res) => {
            navigate(`/session/${res.data._id}`)
        })
    }

    if (sessionResource.isLoading) {
        return (
            <div className='flex flex-col items-center justify-center min-h-screen px-4'>
                <Loading />
                <p className='mt-4 text-gray-600'>Loading session...</p>
            </div>
        )
    }

    return (
        <div className='flex flex-col max-w-6xl gap-4 px-2 py-6 mx-auto sm:py-8 sm:px-6'>
            <header className='mb-6 sm:mb-8'>
                <div>
                    <h1 className='pb-2 mb-5 text-xl font-semibold text-gray-800 border-b border-gray-200'>
                        {session?.name || 'Session'}
                    </h1>

                    {/* Session Progress Indicator */}
                    {session && (
                        <div className='mb-4'>
                            <SessionProgressIndicator session={session} activitiesCount={activities?.length || 0} />
                        </div>
                    )}
                </div>
            </header>

            <section className='flex flex-col gap-5 mb-6 sm:mb-8'>
                {activitiesResource.isLoading ? (
                    <div className='flex items-center justify-center py-10 sm:py-12'>
                        <Loading />
                    </div>
                ) : activities && activities.length > 0 ? (
                    <div className='flex flex-col gap-5'>
                        {activities.map((activity) => (
                            <ActivityCard
                                key={activity._id}
                                activity={activity}
                                onClick={() => navigate(`/activity/${activity._id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className='p-8 text-center rounded-lg sm:p-12 bg-gradient-to-br from-blue-50 to-indigo-100'>
                        <div className='mb-6'>
                            <div className='flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full'>
                                <ClipboardDocumentIcon className='w-10 h-10 text-blue-600' />
                            </div>
                            <h3 className='mb-2 text-xl font-bold text-gray-800'>Ready to Start Your Session?</h3>
                            <p className='max-w-md mx-auto text-sm text-gray-600 sm:text-base'>
                                Let's create your first activity. The system will select the game structure and assemble activity options from your session parameters.
                            </p>
                        </div>
                        <Button.Success
                            onClick={() => navigate('activity-generator')}
                            disabled={generatingActivities}
                            className='w-full'
                        >
                            <ClipboardDocumentIcon className='w-5 mr-2' />
                            Create Your First Activity
                        </Button.Success>
                    </div>
                )}
            </section>

            {session?.sessionStatus !== SessionStatus['Completed'] && (
                <div className='space-y-6'>
                    {/* Contextual Help Text */}
                    <div className='max-w-md mx-auto text-center'>
                        {activities?.length === 0 ? (
                            <p className='text-sm text-gray-600'>
                                Get started by creating your first activity. The system will build activity options from your session parameters and learning goals.
                            </p>
                        ) : (
                            <p className='text-sm text-gray-600'>
                                Continue adding activities to your session, or mark it as complete when you're done.
                            </p>
                        )}
                    </div>
                    {/* Main Actions */}
                    <div className='flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center'>
                        {/* Primary Action: Generate New Activity */}
                        {!generatingActivities && activities?.length > 0 && (
                            <Button.Success
                                onClick={() => navigate('activity-generator')}
                                disabled={generatingActivities}
                                className='w-[80%] sm:w-[40%]'
                            >
                                Generate New Activity
                            </Button.Success>
                        )}

                        {/* Secondary Action: Complete Session */}
                        {activities?.length > 0 && (
                            <Button.Success
                                onClick={completeSession}
                                className='w-[80%] sm:w-[40%] px-4 py-2 text-sm font-medium text-brand-700 bg-white border border-brand-600 hover:bg-brand-50'
                            >
                                <CheckIcon className='w-5' />
                                Mark session as complete
                            </Button.Success>
                        )}
                    </div>
                </div>
            )}

            {/* Session Complete State */}
            {session?.sessionStatus === SessionStatus['Completed'] && (
                <div className='space-y-4 text-center'>
                    <div className='inline-flex items-center px-4 py-2 rounded-full text-brand-800 bg-brand-200'>
                        <CheckIcon className='w-5 h-5 mr-2' />
                        Session Complete
                    </div>
                    <p className='max-w-md mx-auto text-sm text-gray-600'>
                        This session has been marked as complete. You can review the activities or start a new session.
                    </p>

                    {/* Improved Duplicate Session UI */}
                    <div className='flex flex-col w-full pt-4 mt-6 '>
                        <Button.Outline
                            onClick={() => duplicateSession()}
                            className='self-center text-sm rounded-full ring-brand border-brand hover:bg-brand-50'
                        >
                            <DocumentDuplicateIcon className='w-4 h-4 mr-2 transition-transform group-hover:scale-110' />
                            <span className=''>Duplicate this session with all activities</span>
                        </Button.Outline>
                        <p className='max-w-md mx-auto mt-1 text-xs text-gray-500'>
                            This will create a new in-progress session with the same activities.
                        </p>
                    </div>
                </div>
            )}
            {/* Tertiary Action: Return to Dashboard */}
            <div
                className='flex items-center self-center gap-2 mt-2 text-sm text-gray-400 transition-colors cursor-pointer hover:text-gray-700'
                onClick={() => navigate('/')}
            >
                <ArrowLeftCircleIcon className='w-4' />
                <p className='font-normal'>Return to Dashboard</p>
            </div>
        </div>
    )
}

function SessionProgressIndicator({ session, activitiesCount }: { session: ISession; activitiesCount: number }) {
    const getStatusColor = (status: SessionStatus) => {
        switch (status) {
            case SessionStatus.Draft:
                return 'bg-gray-500'
            case SessionStatus['In Progress']:
                return 'bg-blue-500'
            case SessionStatus.Completed:
                return 'bg-brand-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getStatusIcon = (status: SessionStatus) => {
        switch (status) {
            case SessionStatus.Draft:
                return '📝'
            case SessionStatus['In Progress']:
                return '⚡'
            case SessionStatus.Completed:
                return '✅'
            default:
                return '📝'
        }
    }

    return (
        <div className='flex flex-col gap-4 p-4 border rounded-lg sm:flex-row sm:items-center sm:justify-between bg-gray-50'>
            <div className='flex items-center space-x-3'>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(session.sessionStatus)}`}></div>
                <div>
                    <div className='flex items-center space-x-2'>
                        <span className='text-lg'>{getStatusIcon(session.sessionStatus)}</span>
                        <span className='font-medium text-gray-800'>
                            {session.sessionStatus.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                    </div>
                    <p className='text-sm text-gray-600'>
                        {session.sessionStatus === SessionStatus.Draft && 'Ready to start your first activity'}
                        {session.sessionStatus === SessionStatus['In Progress'] && 'Session is active'}
                        {session.sessionStatus === SessionStatus.Completed &&
                            `Completed on ${new Date(session.updatedAt).toLocaleDateString()}`}
                    </p>
                </div>
            </div>

            <div className='flex items-center space-x-4'>
                <div className='text-center'>
                    <div className='text-lg font-bold text-gray-800'>{activitiesCount}</div>
                    <div className='text-xs text-gray-600'>Activities</div>
                </div>

                {session.sessionStatus === SessionStatus['In Progress'] && (
                    <div className='flex items-center space-x-1.5 px-2 py-1 bg-gray-100 rounded-md border border-gray-200'>
                        <div className='w-1.5 h-1.5 bg-brand-500 rounded-full'></div>
                        <span className='text-xs text-gray-600'>Active</span>
                    </div>
                )}
            </div>
        </div>
    )
}

function ActivityCard({ activity, onClick }: { activity: IActivity; onClick: () => void }) {
    // Get status badge color based on activity status
    const getStatusBadgeStyle = (status: ActivityStatus) => {
        switch (status) {
            case ActivityStatus.Completed:
                return 'bg-brand-500 text-white'
            case ActivityStatus['In Progress']:
                return 'bg-blue-100 text-blue-800'
            case ActivityStatus.Review:
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-brand-100 text-brand-800'
        }
    }

    const isCompleted = activity.activityStatus === ActivityStatus.Completed

    return (
        <div
            className='overflow-hidden transition-transform bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg'
            onClick={onClick}
        >
            <div className='p-3 sm:p-5'>
                <div className='flex flex-row items-start justify-between mb-4'>
                    <h3 className='text-base font-bold text-gray-800 break-words sm:text-lg'>{activity.title}</h3>
                    <span
                        className={`self-start text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusBadgeStyle(activity.activityStatus)}`}
                    >
                        {camelCaseToTitleCase(activity.activityStatus)}
                    </span>
                </div>

                <div className='mb-4'>
                    <p className='text-sm text-gray-700 break-words sm:text-base'>Constraint: {activity.constraint}</p>
                    <p className='text-sm text-gray-700 break-words sm:text-base'>Intent: {activity.intent}</p>
                </div>

                {/* Show completion data for completed activities */}
                {isCompleted && (
                    <div className='p-3 mb-4 border rounded-lg border-brand-200 bg-brand-50'>
                        <h4 className='mb-3 text-sm font-semibold text-gray-800'>Activity Results</h4>
                        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                            <div className='flex items-center space-x-2'>
                                <div
                                    className={`w-3 h-3 rounded-full ${activity.breakthroughMoments > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}
                                ></div>
                                <div>
                                    <p className='text-xs font-medium text-gray-800'>Breakthrough Moments</p>
                                    <p className='text-xs text-gray-600'>{activity.breakthroughMoments ?? 0}</p>
                                </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <div
                                    className={`w-3 h-3 rounded-full ${activity.learningPriorities ? 'bg-brand-500' : 'bg-gray-300'}`}
                                ></div>
                                <div>
                                    <p className='text-xs font-medium text-gray-800'>Learning Goals</p>
                                    <p className='text-xs text-gray-600'>
                                        {`${activity.learningPriorities?.filter((lp) => lp.achieved)?.length} / ${activity.learningPriorities?.length}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {activity.coachComments && (
                            <div className='pt-3 mt-3 border-t border-brand-300'>
                                <p className='mb-1 text-xs font-medium text-gray-800'>Coach Comments</p>
                                <p className='text-xs text-gray-700 line-clamp-2'>{activity.coachComments}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className='grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2'>
                    <div className='p-3 rounded bg-gray-50'>
                        <p className='mb-1 text-xs text-gray-500'>Group Sizes</p>
                        <p className='text-xs font-medium break-words sm:text-sm'>{activity.playerGroupSizes}</p>
                    </div>
                    <div className='p-3 rounded bg-gray-50'>
                        <p className='mb-1 text-xs text-gray-500'>Equipment</p>
                        <p className='text-xs font-medium break-words sm:text-sm'>
                            {activity.equipmentNeeded?.join(', ') || 'None'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
