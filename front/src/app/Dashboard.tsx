import { BoltIcon, BookOpenIcon, PlayIcon, PlusIcon, StarIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ROUTES from '@/ROUTES'
import { format, isSameMonth, subMonths } from 'date-fns'

import { ActivityStatus, IActivity } from '@/MODELS/activity.model'
import { ISession } from '@/MODELS/session.model'

import { useAuth } from '@/services/authentication.service'
import { useResource } from '@/services/resource.service'
import { determineZpdZone, zones } from '@/utils/analysis'

import Button from '@/components/Button'
import { DonutChart } from '@/components/DonutChart'
import { LineChart } from '@/components/LineChart'

import logo from '../../logo.png'

export default function DashboardPage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [sessions] = useResource<ISession[]>(`${ROUTES.app.session}/my-sessions`)
    const [activities] = useResource<IActivity[]>(`${ROUTES.app.activity}/my-activities`)
    const [searchParams] = useSearchParams()
    const isNewUser = searchParams.get('newUser') === 'true'

    useEffect(() => {
        if (isNewUser) {
            window.history.replaceState({}, '', '/dashboard')
        }
    }, [isNewUser])

    function generateActivityChartData(activities: IActivity[]) {
        // Return empty array if no activities
        if (!activities || !activities.length) {
            return Array.from({ length: 12 }).map((_, i) => ({
                date: format(new Date(subMonths(Date.now(), 11 - i)), 'MM-yy'),
                'Breakthrough Moments': 0,
                'Learning Goals Achieved': 0,
            }))
        }

        // Generate data for the last 12 months
        return Array.from({ length: 12 }).map((_, i) => {
            const monthDate = new Date(subMonths(Date.now(), 11 - i))

            // Filter activities for this month
            const monthActivities = activities.filter(
                (a) => a.createdAt && isSameMonth(new Date(a.createdAt), monthDate)
            )

            // Count the breakthroughs and goals achieved
            const breakthroughs = monthActivities.reduce((acc, curr) => acc + (curr.breakthroughMoments ?? 0), 0)
            const goalsAchieved = monthActivities.reduce(
                (acc, curr) => acc + (curr.learningPriorities?.filter((lp) => lp.achieved)?.length ?? 0),
                0
            )

            return {
                date: format(monthDate, 'MMM-yy'),
                'Breakthrough Moments': breakthroughs,
                'Learning Goals Achieved': goalsAchieved,
            }
        })
    }

    return (
        <div className='min-h-screen '>
            <div className='px-2 mx-auto max-w-7xl sm:px-6 lg:px-8'>
                {/* Dashboard Header */}
                <header className='flex flex-col gap-6 mb-8 '>
                    <div className='flex flex-col gap-1'>
                        <img src={logo} className='self-center w-28 h-28 sm:hidden' />
                        <h1 className='text-3xl font-bold tracking-tight text-gray-800'>
                            Welcome {isNewUser ? 'to Challenge Point' : 'back'}, {user.firstName}
                        </h1>
                    </div>

                    {/* Simple CTA Section */}
                    <div className='p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md'>
                        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex-1'>
                                <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                                    Ready for Your Next Learning Session?
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    Start a new session to track your learning progress and discover your optimal
                                    challenge zone.
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate('/manage-session/new')}
                                className='flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-colors rounded-lg sm:w-auto bg-brand-600 hover:bg-brand-700'
                            >
                                <PlusIcon className='w-5 h-5' />
                                Start New Session
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Performance Metrics */}
                <section className='mb-10'>
                    <h2 className='flex items-center pb-3 text-xl font-semibold text-gray-800 border-b border-gray-200'>
                        <span className='mr-2'>Performance Metrics</span>
                    </h2>
                    <p className='max-w-3xl pt-2 pb-5 text-xs text-gray-500'>
                        {' '}
                        Here you can monitor progress across different activities. The metrics below provide insights
                        into your learning patterns, showing how many activities align with your optimal Zone of
                        Proximal Development, breakthrough moments you've experienced, and goals you've achieved.
                    </p>

                    {activities && sessions ? (
                        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
                            {/* Metric Card */}
                            <div className='p-5 transition-all bg-gradient-to-br from-white to-indigo-50 border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:translate-y-[-2px]'>
                                <div className='flex items-center'>
                                    <div className='p-3 mr-4 text-indigo-600 rounded-full shadow-sm bg-gradient-to-br from-indigo-100 to-indigo-200'>
                                        <PlayIcon className='w-6 h-6' />
                                    </div>
                                    <div>
                                        <h3 className='text-sm font-medium text-gray-600'>
                                            Total Activities Completed
                                        </h3>
                                        <p className='mt-1 text-3xl font-bold text-gray-800'>
                                            {
                                                activities.filter(
                                                    (a) => a.activityStatus === ActivityStatus['Completed']
                                                )?.length
                                            }
                                        </p>
                                        <p className='mt-1 text-xs text-gray-500'>All tracked learning activities</p>
                                    </div>
                                </div>
                            </div>

                            {/* Metric Card */}
                            <div className='p-5 transition-all bg-gradient-to-br from-white to-brand-50 border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:translate-y-[-2px]'>
                                <div className='flex items-center'>
                                    <div className='p-3 mr-4 rounded-full shadow-sm bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600'>
                                        <StarIcon className='w-6 h-6' />
                                    </div>
                                    <div>
                                        <h3 className='text-sm font-medium text-gray-600'>
                                            Activities in Optimal Learning Zone
                                        </h3>
                                        <p className='mt-1 text-3xl font-bold text-gray-800'>
                                            {Math.round(
                                                (activities.filter(
                                                    (a) =>
                                                        a.activityStatus === ActivityStatus['Completed'] &&
                                                        determineZpdZone(a.difficultyLevel, a.engagementLevel) === 3
                                                ).length /
                                                    (activities.filter(
                                                        (a) => a.activityStatus === ActivityStatus['Completed']
                                                    ).length > 0
                                                        ? activities.filter(
                                                              (a) => a.activityStatus === ActivityStatus['Completed']
                                                          ).length
                                                        : 1)) *
                                                    100
                                            )}
                                            %
                                        </p>
                                        <p className='mt-1 text-xs text-gray-500'>Optimal learning zone</p>
                                    </div>
                                </div>
                            </div>

                            {/* Metric Card */}
                            <div className='p-5 transition-all bg-gradient-to-br from-white to-yellow-50 border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:translate-y-[-2px]'>
                                <div className='flex items-center'>
                                    <div className='p-3 mr-4 text-yellow-600 rounded-full shadow-sm bg-gradient-to-br from-yellow-100 to-yellow-200'>
                                        <BoltIcon className='w-6 h-6' />
                                    </div>
                                    <div>
                                        <h3 className='text-sm font-medium text-gray-600'>Breakthrough Moments</h3>
                                        <p className='mt-1 text-3xl font-bold text-gray-800'>
                                            {activities.reduce(
                                                (acc, curr) => acc + (curr.breakthroughMoments ?? 0),
                                                0
                                            ) ?? 0}
                                        </p>
                                        <p className='mt-1 text-xs text-gray-500'>Key learning insights captured</p>
                                    </div>
                                </div>
                            </div>

                            {/* Metric Card */}
                            <div className='p-5 transition-all bg-gradient-to-br from-white to-green-50 border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:translate-y-[-2px]'>
                                <div className='flex items-center'>
                                    <div className='p-3 mr-4 text-green-600 rounded-full shadow-sm bg-gradient-to-br from-green-100 to-green-300'>
                                        <BookOpenIcon className='w-6 h-6' />
                                    </div>
                                    <div>
                                        <h3 className='text-sm font-medium text-gray-600'>Learning Goals Achieved</h3>
                                        <p className='mt-1 text-3xl font-bold text-gray-800'>
                                            {activities.reduce(
                                                (acc, curr) =>
                                                    acc + curr.learningPriorities.filter((lp) => lp.achieved).length,
                                                0
                                            )}
                                        </p>
                                        <p className='mt-1 text-xs text-gray-500'>Completed learning objectives</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='py-6 text-center'>
                            <p className='text-gray-500'>Loading metrics...</p>
                        </div>
                    )}
                </section>

                {/* Charts Section */}
                <div className='grid grid-cols-1 gap-12 pt-10 sm:pt-2 lg:grid-cols-2'>
                    {/* ZPD Donut Chart */}
                    <div className='relative p-6 overflow-hidden transition-all bg-white border border-gray-100 rounded-lg shadow-md hover:shadow-lg'>
                        <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500'></div>
                        <h3 className='text-lg font-semibold text-gray-800 '>Activities by Learning Zone</h3>
                        <p className='text-sm text-gray-500'>Distribution of activities across learning zones</p>
                        <div className='flex items-center justify-center h-full p-4'>
                            <DonutChartLabelExample
                                chartData={Object.entries(zones).map((z) => ({
                                    name: z[1].name,
                                    amount: activities?.filter(
                                        (a) =>
                                            a.activityStatus === ActivityStatus['Completed'] &&
                                            determineZpdZone(a.difficultyLevel, a.engagementLevel) === Number(z[0])
                                    ).length,
                                }))}
                            />
                        </div>
                    </div>

                    {/* Progress Line Chart */}
                    <div className='relative py-6 overflow-hidden transition-all bg-white border border-gray-100 rounded-lg shadow-md hover:shadow-lg'>
                        <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-teal-500'></div>
                        <h3 className='px-6 text-lg font-semibold text-gray-800 '>Progress Over Time</h3>
                        <p className='px-6 text-sm text-gray-500'>Tracking your learning journey progress</p>
                        <div className='pl-2 pr-4 sm:pl-0 '>
                            <LineChartAxisLabelsExample chartData={generateActivityChartData(activities)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface DataItem {
    name: string
    amount: number
}

export const DonutChartLabelExample = ({ chartData }: { chartData: DataItem[] }) => (
    <DonutChart
        className='mx-auto'
        data={chartData}
        category='name'
        value='amount'
        showLabel={true}
        valueFormatter={(number: number) => `${number} activities`}
    />
)

interface LineDataItem {
    date: string
    'Breakthrough Moments': number
    'Learning Goals Achieved': number
}

export const LineChartAxisLabelsExample = ({ chartData }: { chartData: LineDataItem[] }) => {
    return (
        <LineChart
            className='h-80'
            data={chartData}
            index='date'
            categories={['Breakthrough Moments', 'Learning Goals Achieved']}
            xAxisLabel='Month'
        />
    )
}
