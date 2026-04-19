import { useParams } from 'react-router'
import { FormWrapper } from '@/form-control'
import { SelectField, SelectManyField, TextField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { EcologicalCoachingExperienceLevels, IUser } from '@/MODELS/user.model'

export default function AdminUserForm(props: { id?: string }) {
    const params = useParams()
    const id = props?.id ?? params?.id ?? 'new'

    return (
        <FormWrapper<IUser> endpoint={ROUTES.admin.user} id={id} isPublic={false}>
            {(f) => (
                <>
                    <section className='m-10'>
                        <h1 className='text-3xl font-bold'>Edit User Details</h1>
                        <div className='grid md:grid-cols-2 gap-x-5'>
                            <TextField {...f('firstName')} label='First Name' />
                            <TextField {...f('lastName')} label='Last Name' />
                        </div>
                    </section>
                    <section className='m-10'>
                        <SelectField
                            {...f('ecologicalCoachingExperienceLevel')}
                            options={Object.entries(EcologicalCoachingExperienceLevels).map(([text, value]) => ({
                                value,
                                text,
                            }))}
                        />
                    </section>
                </>
            )}
        </FormWrapper>
    )
}
