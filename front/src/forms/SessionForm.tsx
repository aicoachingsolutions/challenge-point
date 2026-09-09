import { XMarkIcon } from '@heroicons/react/20/solid'
import { ClipboardDocumentListIcon, MapPinIcon } from '@heroicons/react/24/outline'
import React from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrayFieldWrapper, FormWrapper } from '@/form-control'
import { NumberField, SelectField, TextAreaField, TextField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { EngagementLevels } from '@/MODELS/activity.model'
import {
    AgeGroups,
    ISession,
    SessionStatus,
} from '@/MODELS/session.model'

import { api } from '@/services/api.service'
import { useAuth } from '@/services/authentication.service'
import { ResourceController } from '@/services/resource.service'

import Button from '@/components/Button'

// Create options array from AgeGroups enum
const ageGroupOptions = Object.entries(AgeGroups).map(([text, value]) => ({
    value,
    text,
}))

// Surface Type removed for pilot (Path to Pilot Checklist RC4, section 1).
//
// It asked the coach for a planning decision nothing on the live path acted on. Its only two
// consumers were the setup frame, where it was concatenated into an unlabelled "330x160 grass"
// string, and selectAffordances, which has no callers. So the answer was collected and never used,
// and every planning step has to contribute new planning information.
//
// The stored field stays on the session model: existing sessions carry it, and dropping a column to
// remove a question would be a migration for no gain.

const SessionForm: React.FC<{}> = () => {
    const { user } = useAuth()
    const { id } = useParams()
    const navigate = useNavigate()
    return (
        <FormWrapper<ISession>
            endpoint={ROUTES.app.session}
            id={id ?? 'new'}
            callbackAfterSubmit={(res) => {
                navigate(`/session/${res.postResponse.data.data._id}`)
            }}
            submitButtonText={'Start Session'}
            submitButtonAlignment='center'
            insertIntoPostBody={{ createdBy: user._id, sessionStatus: SessionStatus['Draft'] }}
            submitButtonClass={'max-w-sm mx-auto px-8 py-3 text-lg font-semibold shadow-lg'}
        >
            {(f) => {
                return (
                    <div className='min-h-screen px-2 py-6 sm:px-4 lg:px-0'>
                        <div className='max-w-sm mx-auto sm:max-w-3xl'>
                            {/* Header */}
                            <div className='mb-8 text-center'>
                                <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100'>
                                    <ClipboardDocumentListIcon className='w-8 h-8 text-brand-600' />
                                </div>
                                <h1 className='mb-2 text-3xl font-bold text-gray-900'>Create New Session</h1>
                                <p className='max-w-2xl mx-auto text-lg text-gray-600'>
                                    Set up your training session parameters so the system can build the right activity structure
                                </p>
                            </div>

                            {/* Form Container */}
                            <div className='bg-white shadow-xl rounded-2xl'>
                                {/* Session Parameters Section */}
                                <div className='p-2 border-b border-gray-100 sm:p-8'>
                                    <div className='mb-6'>
                                        <div className='flex items-center gap-3 mb-2'>
                                            <div className='flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100'>
                                                <ClipboardDocumentListIcon className='w-5 h-5 text-brand-600' />
                                            </div>
                                            <h2 className='text-xl font-semibold text-gray-900'>Session Parameters</h2>
                                        </div>
                                        <p className='text-sm text-gray-600 ml-11'>
                                            Basic information about your training session and participants
                                        </p>
                                    </div>

                                    <div className='space-y-6'>
                                        {/* Session Name - Full Width */}
                                        <div>
                                            <TextField
                                                {...f('name')}
                                                label='Session Name'
                                                labelClass='text-gray-700 font-medium mb-2 block'
                                                inputClass='text-base'
                                                placeholder='e.g., Morning Practice Session, Skill Development'
                                                className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                            />
                                        </div>

                                        {/* Two Column Grid */}
                                        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                                            <div>
                                                <NumberField
                                                    {...f('playerCount')}
                                                    label='Number of Players'
                                                    labelClass='text-gray-700 font-medium mb-2 block'
                                                    inputClass='text-base'
                                                    placeholder='e.g., 12'
                                                    min={1}
                                                    max={50}
                                                    className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                                />
                                            </div>

                                            <div>
                                                <SelectField
                                                    {...f('ageGroup')}
                                                    label='Age Group'
                                                    options={ageGroupOptions}
                                                    labelClass='text-gray-700 font-medium mb-2 block'
                                                    inputClass='text-base'
                                                    placeholder='Select age group'
                                                    className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                                />
                                            </div>
                                        </div>

                                        {/*
                                          * GAME SKILL LEVEL AND ACTIVITY EMPHASIS BOTH REMOVED, at
                                          * Christian's request (25 Aug): asking a coach to
                                          * characterise their players here AND again at the Learning
                                          * Stage step made it unclear which one the engine listens to.
                                          *
                                          * Skill level was answerable: nothing read it. The only
                                          * consumer was select-affordance.ts, which nothing imports —
                                          * so the field a coach filled in reached no decision at all.
                                          *
                                          * Emphasis was NOT inert, and removing it changes behaviour
                                          * for the better. This form defaulted every session to
                                          * 'Applying Solutions Under Pressure' — the deliberately
                                          * NARROW profile, which produces three near-identical
                                          * activities on purpose. The engine's default for an unset
                                          * emphasis is the differentiated profile, so every session
                                          * created here has been opted into the narrow one without
                                          * the coach choosing it. Omitting the field means sessions
                                          * now get the differentiated default.
                                          */}
                                    </div>
                                </div>

                                {/* Field Information Section */}
                                <div className='px-2 py-5 sm:p-8'>
                                    <div className='mb-6'>
                                        <div className='flex items-center gap-3 mb-2'>
                                            <div className='flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg'>
                                                <MapPinIcon className='w-5 h-5 text-green-600' />
                                            </div>
                                            <h2 className='text-xl font-semibold text-gray-900'>Field Information</h2>
                                        </div>
                                        <p className='text-sm text-gray-600 ml-11'>
                                            Details about your practice space and environment
                                        </p>
                                    </div>

                                    <div className='space-y-6'>
                                        {/* Field Dimensions */}
                                        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                                            {/*
                                              * METRIC FIRST, and the number means the PLAYING AREA.
                                              *
                                              * Both parts were wrong together, and each hid the
                                              * other. These fields asked for feet and defaulted to a
                                              * full pitch (330 x 160), while generation consumed the
                                              * same numbers as the area to play in, with no unit
                                              * attached. Run at that default, two of three generated
                                              * activities gave the coach no dimensions at all and
                                              * the third invented "a 40x30 yard area".
                                              *
                                              * Metric leads because roughly half of pilot coaches
                                              * think in metres; the yard equivalent follows in
                                              * brackets, which is the same order the generated
                                              * activity now uses.
                                              */}
                                            <div>
                                                <NumberField
                                                    {...f('fieldLength')}
                                                    label='Playing area length'
                                                    defaultValue={40}
                                                    labelClass='text-gray-700 font-medium mb-2 block'
                                                    inputClass='text-base'
                                                    placeholder='40'
                                                    min={10}
                                                    max={120}
                                                    className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                                />
                                                <p className='mt-2 text-sm text-gray-500'>
                                                    Length in metres (typical: 40 m / 44 yd)
                                                </p>
                                            </div>

                                            <div>
                                                <NumberField
                                                    {...f('fieldWidth')}
                                                    label='Playing area width'
                                                    defaultValue={30}
                                                    labelClass='text-gray-700 font-medium mb-2 block'
                                                    inputClass='text-base'
                                                    placeholder='30'
                                                    min={10}
                                                    max={90}
                                                    className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                                />
                                                <p className='mt-2 text-sm text-gray-500'>
                                                    Width in metres (typical: 30 m / 33 yd)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button Section */}
                                <div className='px-8 py-6 border-t border-gray-100 bg-gray-50'>
                                    <div className='text-center'>
                                        <p className='mb-4 text-sm text-gray-600'>
                                            Ready to create your session? You'll be able to generate activities once your
                                            session is set up.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }}
        </FormWrapper>
    )
}

export default SessionForm
