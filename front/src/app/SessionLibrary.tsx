import { ChartBarIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router'
import ROUTES from '@/ROUTES'
import { format } from 'date-fns'

import { ISession, SessionStatus } from '@/MODELS/session.model'

import { useResource } from '@/services/resource.service'

import Button from '@/components/Button'
import Loading from '@/components/Loading'
import { camelCaseToTitleCase } from '@/utils/scary-utils'
import { api } from '@/services/api.service'

export default function SessionLibrary() {
    const navigate = useNavigate()
    const [sessions, setSessions, sessionsResource] = useResource<ISession[]>(`${ROUTES.app.session}/my-sessions`)

    return (
        <div className='min-h-screen py-6'>
            <div className='px-2 mx-auto max-w-7xl sm:px-6 lg:px-8'>
                {/* Header Section */}
                <section className='mb-8'>
                    <h2 className='pb-2 mb-5 text-xl font-semibold text-gray-800 border-b border-gray-200'>
                        Your Sessions
                    </h2>
                    <p className='mb-5 text-xs text-gray-500'>
                        Welcome to your Coaching Sessions dashboard. Here you can manage all the training sessions
                        you've created for your players and design new ones to elevate their performance. Your library of sessions allows you to build a progressive coaching
                        curriculum while tracking what you've implemented with your team.
                    </p>
                    {sessionsResource.isLoading && <Loading />}

                    {sessions && sessions.length === 0 && (
                        <div className='flex flex-col p-8 text-center bg-white border border-gray-100 rounded-lg shadow-sm'>
                            <Square3Stack3DIcon className='w-12 h-12 mx-auto mb-4 text-gray-400' />
                            <p className='mb-4 text-gray-600'>You haven't created any sessions yet.</p>
                            <Button onClick={() => navigate(`/manage-session/new`)} className='w-[80%] self-center'>Start New Session</Button>
                        </div>
                    )}

                    {sessions && sessions.length > 0 && (
                        <>
                            <div className='grid grid-cols-1 gap-5 mb-6 md:grid-cols-2'>
                                {sessions.map((session) => (
                                    <SessionCard
                                        key={session._id}
                                        session={session}
                                        onClick={() => navigate(`/session/${session._id}`)}
                                    />
                                ))}
                            </div>
                            <div className='flex justify-center'>
                                <Button onClick={() => navigate(`/manage-session/new`)}>Create Session</Button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    )
}

export function SessionCard({ session, onClick }: { session: ISession; onClick: () => void }) {
    // Helper function to get status badge styles
    const getStatusBadge = (status: SessionStatus) => {
        switch (status) {
            case SessionStatus.Draft:
                return {
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-800',
                    icon: (
                        <svg
                            className='w-4 h-4 mr-1'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                            />
                        </svg>
                    ),
                }
            case SessionStatus['In Progress']:
                return {
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-800',
                    icon: (
                        <svg
                            className='w-4 h-4 mr-1'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                        </svg>
                    ),
                }
            case SessionStatus.Completed:
                return {
                    bgColor: 'bg-brand-500/80',
                    textColor: 'text-white',
                    icon: (
                        <svg
                            className='w-4 h-4 mr-1'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                        </svg>
                    ),
                }
            default:
                return {
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    icon: null,
                }
        }
    }

    const statusBadge = getStatusBadge(session.sessionStatus)
    const createdAtDate = new Date(session.createdAt)
    const formattedDate = format(createdAtDate, 'MMM d, yyyy')
    const navigate = useNavigate()

        const duplicateSession = () => {
        api<ISession>(`${ROUTES.app.session}/${session._id}/duplicate`).then((res) => {
            navigate(`/session/${res.data._id}`)
        })
    }

    return (
        <div
            onClick={onClick}
            className='overflow-hidden transition-all bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300'
        >
            <div className='flex flex-col p-5'>
                <div className='flex items-start justify-between mb-5'>
                    <h3 className='text-lg font-semibold text-gray-800 line-clamp-1'>{session.name}</h3>
                    <span
                        className={`flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge.bgColor} ${statusBadge.textColor}`}
                    >
                        {statusBadge.icon}
                        {camelCaseToTitleCase(session.sessionStatus)}
                    </span>
                </div>

                <div className='grid grid-cols-2 gap-3 mb-4'>
                    {session.ageGroup && (
                        <div className='flex items-center'>
                            <svg
                                className='w-4 h-4 mr-2 text-gray-400'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                />
                            </svg>
                            <span className='text-sm text-gray-600'>{session.ageGroup.replace('u', 'Under ')}</span>
                        </div>
                    )}

                    {session.skillLevel && (
                        <div className='flex items-center gap-2'>
                            <ChartBarIcon className='w-5 text-gray-400' />
                            <span className='text-sm text-gray-600 capitalize'>{session.skillLevel}</span>
                        </div>
                    )}
                </div>

                <div className='mb-3'>
                    {session.playerCount && (
                        <div className='flex items-center mb-1'>
                            <svg
                                className='w-4 h-4 mr-2 text-gray-400'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                                />
                            </svg>
                            <span className='text-sm text-gray-600'>{session.playerCount} players</span>
                        </div>
                    )}


                </div>



                <div className='flex items-center justify-between pt-3 mt-3 text-xs text-gray-500 border-t border-gray-100'>
                    <p>Created on {formattedDate}</p>
                    {session.sessionStatus === SessionStatus['Completed'] && <Button className='text-xs rounded-full' onClick={(e) => {e.preventDefault() ; duplicateSession()}}>
                    Re-Run Session
                </Button>}
                </div>
                
            </div>
        </div>
    )
}
