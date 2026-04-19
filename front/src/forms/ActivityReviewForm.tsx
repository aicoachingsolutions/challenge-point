import { TrophyIcon } from '@heroicons/react/20/solid'
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrayFieldWrapper, FormWrapper } from '@/form-control'
import {
    CheckboxField,
    CurrencyField,
    DateField,
    NumberField,
    SelectField,
    SelectManyField,
    TextAreaField,
    TextField,
    TimeField,
    ToggleField,
} from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { ActivityStatus, DifficultyLevels, EngagementLevels, IActivity } from '@/MODELS/activity.model'

import { determineZpdZone, getZoneInfo } from '@/utils/analysis'

import Button from '@/components/Button'

export default function ActivityReviewForm(props: {
    id?: string
    updateActivityStatus: (updatedStatus: ActivityStatus) => Promise<void>
}) {
    const params = useParams()
    const id = props?.id ?? params?.id ?? 'new'
    const navigate = useNavigate()

    const handleSubmissionSuccess = async (res: any) => {
        navigate(`/session/${res.formValues.session._id}`)
    }

    return (
        <div className='max-w-4xl mx-auto'>
            <div className='mb-6 text-center'>
                <h1 className='mb-2 text-2xl font-bold text-gray-800'>Activity Review</h1>
                <p className='text-gray-600'>Provide feedback on how the activity went</p>
            </div>

            <FormWrapper<IActivity>
                endpoint={ROUTES.app.activity}
                insertIntoPostBody={{ activityStatus: ActivityStatus.Completed }}
                id={id}
                callbackAfterSubmit={handleSubmissionSuccess}
                submitButtonAlignment='center'
                submitButtonClass={
                    'w-full max-w-md py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white'
                }
                submitButtonText='Complete Activity Review'
            >
                {(f, { formValues, setFormValues }) => {
                    const zoneNumber = determineZpdZone(
                        formValues.difficultyLevel || DifficultyLevels.Medium,
                        formValues.engagementLevel || EngagementLevels.Medium
                    )
                    const zoneInfo = getZoneInfo(zoneNumber)

                    return (
                        <div className='space-y-8'>
                            {/* Implementation Feedback */}
                            <div className='bg-white border rounded-lg shadow-sm'>
                                <div className='p-6'>
                                    <h2 className='mb-6 text-xl font-bold text-gray-800'>Learning Zone Assessment</h2>

                                    <div className='mb-6'>
                                        <h3 className='mb-2 text-lg font-semibold text-gray-800'>
                                            Performance Analysis
                                        </h3>
                                        <p className='mb-6 text-sm text-gray-600'>
                                            Based on the difficulty and engagement levels you observed during the
                                            activity
                                        </p>

                                        {/* ZPD Zone Visualization */}
                                        <div className='p-4 rounded-lg bg-gray-50'>
                                            <div className='mb-3'>
                                                <div className='flex h-8 mb-3 overflow-hidden rounded-full shadow-inner'>
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
                                                        className='absolute transform -translate-x-1/2'
                                                        style={{
                                                            left: `${(zoneNumber - 0.5) * 20}%`,
                                                            top: '-65px',
                                                            color: zoneInfo.color,
                                                        }}
                                                    >
                                                        <ChevronDownIcon className='w-6 h-6 drop-shadow-lg' />
                                                    </div>
                                                </div>

                                                {/* Zone labels */}
                                                <div className='flex justify-between text-xs font-medium text-gray-600'>
                                                    <span>Too Easy</span>
                                                    <span className='text-[#00BFFF]'>Optimal</span>
                                                    <span>Too Hard</span>
                                                </div>
                                            </div>

                                            {/* Zone information */}
                                            <div
                                                className='p-4 mt-4 border-l-4 rounded-lg'
                                                style={
                                                    {
                                                        backgroundColor: `${zoneInfo.color}15`,
                                                        borderLeftColor: zoneInfo.color,
                                                    } as React.CSSProperties
                                                }
                                            >
                                                <div className='flex items-center gap-3 mb-2'>
                                                    <div
                                                        className='w-3 h-3 rounded-full'
                                                        style={{ backgroundColor: zoneInfo.color }}
                                                    ></div>
                                                    <h4 className='font-semibold text-gray-800'>{zoneInfo.name}</h4>
                                                </div>
                                                <p className='text-sm leading-relaxed text-gray-700'>
                                                    {zoneInfo.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Outcome Assessment */}
                            <div className='bg-white border rounded-lg shadow-sm'>
                                <div className='p-6'>
                                    <h2 className='mb-6 text-xl font-bold text-gray-800'>Outcome Assessment</h2>

                                    <div className='grid grid-cols-1 gap-6 mb-6 md:grid-cols-2'>
                                        <div className='p-5 border border-blue-200 rounded-lg bg-blue-50'>
                                            <NumberField
                                                {...f('breakthroughMoments')}
                                                label='How many players experienced a breakthrough moment?'
                                                labelClass='text-sm text-gray-800 mb-1'
                                            />
                                            <p className='mt-2 text-xs text-gray-600 '>
                                                A moment where players suddenly "got it" or made a significant
                                                improvement
                                            </p>
                                        </div>

                                        <div className='p-5 border border-green-200 rounded-lg bg-green-50'>
                                            <div className='flex flex-col'>
                                                {/* <CheckboxField 
                                                    {...f('goalAchieved')} 
                                                    label='Were the learning goals achieved?' 
                                                    labelClass='text-base font-semibold text-gray-800'
                                                    display='inline-reverse'
                                                    inputClass='w-5 h-5 text-green-600'
                                                /> */}

                                                {formValues.learningPriorities &&
                                                    formValues.learningPriorities.length > 0 && (
                                                        <div className='mt-3 '>
                                                            <p className='mb-2 text-sm font-medium text-gray-700'>
                                                                Your Learning Goals:
                                                            </p>
                                                            <ul className='space-y-1'>
                                                                {formValues.learningPriorities.map((goal, index) => (
                                                                    <CheckboxField
                                                                        value={goal.achieved}
                                                                        onChange={(v) => {
                                                                            const updatedFormValues = { ...formValues }
                                                                            updatedFormValues.learningPriorities[
                                                                                index
                                                                            ].achieved = v
                                                                            setFormValues(updatedFormValues)
                                                                        }}
                                                                        label={goal.description}
                                                                        display='inline-reverse'
                                                                        labelClass='ml-0 text-xs text-gray-700'
                                                                    />
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Points Tracking */}
                            {formValues.pointsTracking && formValues.pointsTracking?.length > 0 && (
                                <div className='p-6 bg-white border rounded-lg shadow-sm'>
                                    <h2 className='flex items-center mb-5 text-xl font-bold text-gray-800'>
                                        Scoreboard
                                    </h2>

                                    <div className='flex flex-col gap-3 mb-4'>
                                        {formValues.pointsTracking.map((pt, index) => (
                                            <div
                                                key={index}
                                                className='flex items-center justify-between p-3 transition-shadow border border-gray-100 rounded-lg bg-gray-50 hover:shadow-sm'
                                            >
                                                <div className='flex items-center'>
                                                    <div className='flex items-center justify-center w-8 h-8 mr-3 font-semibold rounded-full text-brand-600 bg-brand-100'>
                                                        {pt.teamName.charAt(0)}
                                                    </div>
                                                    <span className='font-medium text-gray-700'>{pt.teamName}</span>
                                                </div>
                                                <div className='px-4 py-1 font-bold rounded-full text-brand-700 bg-brand-50'>
                                                    {pt.points} {pt.points === 1 ? 'point' : 'points'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {formValues.pointsTracking.length > 1 && (
                                        <div className='pt-4 mt-6 border-t border-gray-100'>
                                            <h3 className='mb-2 text-sm font-semibold text-gray-500'>WINNER</h3>
                                            <div className='flex items-center gap-2'>
                                                <TrophyIcon className='w-5 h-5 text-yellow-500' />
                                                <span className='text-lg font-bold text-brand-600'>
                                                    {
                                                        [...formValues.pointsTracking].sort(
                                                            (a, b) => b.points - a.points
                                                        )[0].teamName
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Coach Observations */}
                            <div className='bg-white border rounded-lg shadow-sm'>
                                <div className='p-6'>
                                    <h2 className='mb-4 text-xl font-bold text-gray-800'>Coach Observations</h2>
                                    <p className='mb-4 text-sm text-gray-600'>
                                        Share your insights about what worked well, what could be improved, and any
                                        notable observations
                                    </p>

                                    <TextAreaField
                                        {...f('coachComments')}
                                        rows={5}
                                        labelClass='text-base font-semibold text-gray-800 mb-3'
                                        placeholder='Example: The players responded well to the competitive element. Next time, I might increase the challenge level slightly as they mastered the basic movements quickly...'
                                        className='w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }}
            </FormWrapper>
        </div>
    )
}
