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
            {(f, { formValues, setFormValues }) => {
                /**
                 * Record how many people in a specialized role are at this session — or record nothing.
                 *
                 * This field is written by hand rather than through `f(...)` for one reason: the form
                 * helper stores whatever the input reports, and a cleared number input reports NaN,
                 * which is posted as `null`. A `null` here would be a third state between "not stated"
                 * and a number, and the session must only ever hold the two. So a whole number of zero
                 * or more is stored, and anything else REMOVES the role's entry.
                 *
                 * An untouched field never reaches this function, so a new session posts no
                 * `specializedRoles` at all — and typing an answer then clearing it comes to the same
                 * thing, because an empty map on a session not yet stored is dropped again. On a
                 * session that IS stored the empty map is kept and posted, so that clearing an answer
                 * it already held is sent as a change instead of being lost as an omission.
                 */
                const setRoleAvailability = (role: string, count: number) =>
                    setFormValues((values) => {
                        const specializedRoles = { ...(values?.specializedRoles ?? {}) }
                        if (Number.isInteger(count) && count >= 0) specializedRoles[role] = count
                        else delete specializedRoles[role]

                        if (!values?._id && Object.keys(specializedRoles).length === 0) {
                            const { specializedRoles: _nothingStated, ...rest } = values ?? {}
                            return rest
                        }
                        return { ...values, specializedRoles }
                    })

                /**
                 * Record how many goals the session has, and how wide they are — or record nothing (stage E, 23 October 2026).
                 *
                 * Written by hand for the reason the goalkeeper field is: a cleared box reports NaN, and the session must hold only
                 * "not stated" (no entry) or a statement. A whole number of zero or more is stored as the count; anything else REMOVES
                 * the kind's entry, width and all. A width is kept only beside a count of one or more, as a number of metres above
                 * zero; a count of zero carries none. The key is the kind's name as the knowledge register lists it (its
                 * sessionResources block), which is what the activity review reads.
                 */
                const goalsStated = formValues?.objects?.goal
                const setObjects = (kind: string, change: { count?: number; widthM?: number }) =>
                    setFormValues((values) => {
                        const objects = { ...(values?.objects ?? {}) }
                        // A stored entry always holds a count (an entry without one is never written here), so it is read as one.
                        let next: { count: number; widthM?: number } | undefined = objects[kind] ? { ...(objects[kind] as { count: number; widthM?: number }) } : undefined
                        if ('count' in change) {
                            const count = change.count
                            next = typeof count === 'number' && Number.isInteger(count) && count >= 0 ? { ...(next ?? { count }), count } : undefined
                            if (next && next.count === 0) delete next.widthM
                        }
                        if ('widthM' in change && next) {
                            const width = change.widthM
                            if (typeof width === 'number' && Number.isFinite(width) && width > 0 && next.count > 0) next.widthM = width
                            else delete next.widthM
                        }
                        if (next) objects[kind] = next
                        else delete objects[kind]

                        if (!values?._id && Object.keys(objects).length === 0) {
                            const { objects: _nothingStated, ...rest } = values ?? {}
                            return rest
                        }
                        return { ...values, objects }
                    })

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

                                            {/*
                                              * GOALKEEPERS AVAILABLE — asked, never assumed.
                                              *
                                              * Christian, 13 October: "Goalkeeper availability should
                                              * come from the Team Profile or session configuration,
                                              * with the coach able to confirm or adjust it. The system
                                              * should not silently assume that no goalkeepers are
                                              * available."
                                              *
                                              * NO DEFAULT VALUE, and that is the whole design. Blank
                                              * means the coach has not said, and it is stored as
                                              * nothing; zero means there are none, and it is stored as
                                              * zero. A pre-filled 0 would turn every coach who skipped
                                              * the question into one who answered it.
                                              *
                                              * The key is the role's name as the knowledge register
                                              * holds it, which is what the activity review looks up.
                                              *
                                              * This asks who is AVAILABLE, not who plays in goal in a
                                              * given activity: whether a game uses a goalkeeper is
                                              * decided by that game.
                                              */}
                                            <div>
                                                <NumberField
                                                    label='Goalkeepers available'
                                                    value={formValues?.specializedRoles?.goalkeeper}
                                                    onChange={(count) => setRoleAvailability('goalkeeper', count)}
                                                    labelClass='text-gray-700 font-medium mb-2 block'
                                                    inputClass='text-base'
                                                    placeholder='e.g., 2 — enter 0 if none'
                                                    min={0}
                                                    step={1}
                                                    className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                                />
                                                <p className='mt-2 text-sm text-gray-500'>
                                                    How many of your players are goalkeepers today. Leave it blank if you are not sure yet.
                                                </p>
                                            </div>

                                            {/*
                                              * GOALS AVAILABLE — asked, never assumed (stage E, 23 October 2026). DRAFT wording.
                                              *
                                              * Christian, reply filed 25 October 2026, item 4: "I agree with your finding that
                                              * goalkeeper availability and physical-goal availability must be represented
                                              * separately." So it is its own question, never inferred from the goalkeepers above,
                                              * and blank means not stated, exactly as there. The width is asked beside it because
                                              * a goal's size is the coach's equipment: nothing here or on the server assumes one.
                                              * Whether a particular activity uses a goal is decided by that activity.
                                              */}
                                            <div>
                                                <NumberField
                                                    label='Goals available'
                                                    value={goalsStated?.count}
                                                    onChange={(count) => setObjects('goal', { count })}
                                                    labelClass='text-gray-700 font-medium mb-2 block'
                                                    inputClass='text-base'
                                                    placeholder='e.g., 1 — enter 0 if none'
                                                    min={0}
                                                    step={1}
                                                    className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                                />
                                                <p className='mt-2 text-sm text-gray-500'>
                                                    How many goals you can use today. Leave it blank if you are not sure yet.
                                                </p>
                                            </div>

                                            <div>
                                                <NumberField
                                                    label='Goal width (metres)'
                                                    value={goalsStated?.widthM}
                                                    onChange={(widthM) => setObjects('goal', { widthM })}
                                                    disabled={!goalsStated || goalsStated.count < 1}
                                                    labelClass='text-gray-700 font-medium mb-2 block'
                                                    inputClass='text-base'
                                                    placeholder='e.g., 5'
                                                    min={0}
                                                    step={0.1}
                                                    className='w-full transition-colors border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                                                />
                                                <p className='mt-2 text-sm text-gray-500'>
                                                    How wide your goals are, post to post. Asked once you say you have a goal.
                                                </p>
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
                                          * the coach choosing it. Omitting the field was meant to give
                                          * sessions the differentiated default. It only did from 14 Sep:
                                          * until then the back-end session schema filled in 'applying'
                                          * itself, on every session.
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
