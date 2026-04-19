import { useNavigate, useParams } from 'react-router'
import { Link } from 'react-router-dom'
import { FormWrapper } from '@/form-control'
import { PasswordField, ProfileImageField, SelectField, TextField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { EcologicalCoachingExperienceLevels, IUser } from '@/MODELS/user.model'

import { useAuth } from '@/services/authentication.service'

import Button from '@/components/Button'

export default function ProfileForm(props: { id?: string }) {
    const params = useParams()
    const id = props?.id ?? params?.id ?? 'new'
    const { user } = useAuth()
    const navigate = useNavigate()
    return (
        <div className='flex flex-col px-2 py-6'>
            <FormWrapper<IUser>
                endpoint={ROUTES.app.user}
                id={user._id}
                submitButtonAlignment='center'
                submitButtonClass='mt-10 w-full sm:w-1/2'
            >
                {(f) => (
                    <div className='space-y-10'>
                        <section className='space-y-6'>
                            <h2 className='pb-2 mb-5 text-xl font-semibold text-gray-800 border-b border-gray-200'>
                                Profile Information
                            </h2>
                            <div className='grid gap-x-6 gap-y-4 md:grid-cols-2'>
                                <TextField {...f('firstName')} />
                                <TextField {...f('lastName')} />
                                <TextField {...f('email')} containerClass='col-span-2' label='Email' disabled />
                            </div>
                        </section>
                    </div>
                )}
            </FormWrapper>

            <Button.Outline
                onClick={() => navigate('/logout')}
                className='w-full mx-auto my-12 transition-colors duration-300 sm:w-1/4'
            >
                Logout
            </Button.Outline>
        </div>
    )
}
